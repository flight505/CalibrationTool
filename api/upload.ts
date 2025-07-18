import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file uploads
  },
};

interface ParsedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

async function analyzeJSONFile(content: string) {
  try {
    const data = JSON.parse(content);
    
    // Analyze OrcaSlicer settings structure
    const analysis = {
      type: 'orcaslicer_config',
      sections: [] as string[],
      settingsCount: 0,
      keySettings: {} as Record<string, any>,
    };
    
    // Check for common OrcaSlicer config sections
    const commonSections = ['print', 'filament', 'printer', 'process'];
    for (const section of commonSections) {
      if (data[section]) {
        analysis.sections.push(section);
        analysis.settingsCount += Object.keys(data[section]).length;
        
        // Extract key settings
        if (section === 'filament' && data[section].filament_flow_ratio) {
          analysis.keySettings.flowRatio = data[section].filament_flow_ratio;
        }
        if (section === 'print' && data[section].nozzle_temperature) {
          analysis.keySettings.temperature = data[section].nozzle_temperature;
        }
        if (section === 'print' && data[section].pressure_advance) {
          analysis.keySettings.pressureAdvance = data[section].pressure_advance;
        }
      }
    }
    
    return {
      success: true,
      analysis,
      summary: `OrcaSlicer configuration with ${analysis.settingsCount} settings across ${analysis.sections.join(', ')}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse JSON file',
    };
  }
}

async function analyzeImageWithVision(filepath: string, mimetype: string, openai: OpenAI) {
  try {
    // Read image file as base64
    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString('base64');
    
    // Use OpenAI Vision to analyze the image
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this 3D printing related image. Identify any visible issues, print quality problems, or calibration needs. Also describe what settings might need adjustment.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });
    
    return {
      success: true,
      analysis: response.choices[0].message.content,
    };
  } catch (error) {
    console.error('Vision API error:', error);
    return {
      success: false,
      error: 'Failed to analyze image',
    };
  }
}

async function analyzeSTLFile(content: Buffer) {
  // Basic STL file analysis
  const isASCII = content.toString('utf8', 0, 5) === 'solid';
  
  if (!isASCII) {
    // Binary STL
    const triangleCount = content.readUInt32LE(80);
    const expectedSize = 84 + (triangleCount * 50);
    
    return {
      success: true,
      analysis: {
        format: 'binary',
        triangleCount,
        fileSize: content.length,
        sizeValid: content.length === expectedSize,
      },
      summary: `Binary STL with ${triangleCount.toLocaleString()} triangles`,
    };
  } else {
    // ASCII STL - count triangles
    const text = content.toString('utf8');
    const triangleMatches = text.match(/facet normal/g);
    const triangleCount = triangleMatches ? triangleMatches.length : 0;
    
    return {
      success: true,
      analysis: {
        format: 'ascii',
        triangleCount,
        fileSize: content.length,
      },
      summary: `ASCII STL with ${triangleCount.toLocaleString()} triangles`,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Initialize database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });
  
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Get session ID from headers
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
    keepExtensions: true,
  });
  
  try {
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const parsedFile = file as ParsedFile;
    
    // Read file content
    const content = await fs.readFile(parsedFile.filepath);
    
    let extractedContent = '';
    let metadata: any = {
      originalName: parsedFile.originalFilename,
      mimeType: parsedFile.mimetype,
      size: parsedFile.size,
    };
    
    // Analyze based on file type
    if (parsedFile.mimetype === 'application/json') {
      const result = await analyzeJSONFile(content.toString('utf8'));
      if (result.success) {
        extractedContent = result.summary || '';
        metadata.analysis = result.analysis;
      }
    } else if (parsedFile.mimetype.startsWith('image/')) {
      const result = await analyzeImageWithVision(parsedFile.filepath, parsedFile.mimetype, openai);
      if (result.success) {
        extractedContent = result.analysis || '';
        metadata.visionAnalysis = true;
      }
    } else if (parsedFile.originalFilename?.endsWith('.stl')) {
      const result = await analyzeSTLFile(content);
      if (result.success) {
        extractedContent = result.summary || '';
        metadata.analysis = result.analysis;
      }
    } else {
      // For other file types, just extract text if possible
      extractedContent = content.toString('utf8').slice(0, 1000);
    }
    
    // Store file metadata in database
    const fileId = uuidv4();
    await pool.query(
      `INSERT INTO file_uploads 
       (id, session_id, filename, mime_type, size_bytes, content_extracted, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        fileId,
        sessionId,
        parsedFile.originalFilename,
        parsedFile.mimetype,
        parsedFile.size,
        extractedContent,
        JSON.stringify(metadata),
      ]
    );
    
    // Clean up temporary file
    await fs.unlink(parsedFile.filepath);
    
    // Close pool connection
    await pool.end();
    
    return res.status(200).json({
      success: true,
      fileId,
      filename: parsedFile.originalFilename,
      extractedContent,
      metadata,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    await pool.end();
    return res.status(500).json({ error: 'Failed to process upload' });
  }
}
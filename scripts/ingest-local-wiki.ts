import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Create our own pool instance after env vars are loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { EntityExtractor } from '../src/lib/lightrag/entityExtractor';
const entityExtractor = new EntityExtractor();

interface ProcessedFile {
  title: string;
  content: string;
  url: string;
  sourceType: string;
  metadata: Record<string, any>;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit text length
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

async function extractTitleFromContent(content: string, filename: string): string {
  // Try to extract title from first # heading
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback to filename without extension
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

async function processMarkdownFile(filePath: string, baseDir: string): Promise<ProcessedFile | null> {
  const content = await readMarkdownFile(filePath);
  if (!content) return null;
  
  const relativePath = path.relative(baseDir, filePath);
  const filename = path.basename(filePath);
  const title = await extractTitleFromContent(content, filename);
  
  // Determine source type based on directory
  let sourceType = 'wiki';
  if (relativePath.includes('calibration/')) {
    sourceType = 'calibration';
  } else if (relativePath.includes('developer-reference/')) {
    sourceType = 'developer';
  } else if (relativePath.includes('material_settings/')) {
    sourceType = 'material';
  } else if (relativePath.includes('print_settings/')) {
    sourceType = 'print_settings';
  } else if (relativePath.includes('printer_settings/')) {
    sourceType = 'printer_settings';
  }
  
  return {
    title,
    content,
    url: `https://github.com/SoftFever/OrcaSlicer/wiki/${relativePath.replace(/\.md$/, '')}`,
    sourceType,
    metadata: {
      path: relativePath,
      filename,
    },
  };
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'images') {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function processDocument(doc: ProcessedFile): Promise<boolean> {
  console.log(`Processing: ${doc.title}`);
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(`${doc.title} ${doc.content}`);
    
    // Check if document already exists
    const existingResult = await pool.query(
      'SELECT id FROM documents WHERE url = $1',
      [doc.url]
    );
    
    let documentId: number;
    
    if (existingResult.rows.length > 0) {
      // Update existing document
      await pool.query(
        `UPDATE documents 
         SET title = $1, content = $2, source_type = $3, metadata = $4, embedding_json = $5, updated_at = CURRENT_TIMESTAMP
         WHERE url = $6`,
        [
          doc.title,
          doc.content,
          doc.sourceType,
          JSON.stringify(doc.metadata),
          JSON.stringify(embedding),
          doc.url
        ]
      );
      documentId = existingResult.rows[0].id;
      console.log(`  ✓ Updated existing document: ${documentId}`);
    } else {
      // Insert new document
      const insertResult = await pool.query(
        `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          doc.title,
          doc.content,
          doc.url,
          doc.sourceType,
          JSON.stringify(doc.metadata),
          JSON.stringify(embedding)
        ]
      );
      documentId = insertResult.rows[0].id;
      console.log(`  ✓ Document inserted: ${documentId}`);
    }
    
    // Extract entities (limit content to avoid token limits)
    try {
      const contentForExtraction = doc.content.slice(0, 3000);
      const entities = await entityExtractor.extractEntities(contentForExtraction);
      console.log(`  ✓ Extracted ${entities.length} entities`);
      
      // Process entities
      for (const entity of entities) {
        try {
          const existingEntityResult = await pool.query(
            `SELECT id FROM kg_entities WHERE name = $1 AND entity_type = $2`,
            [entity.name, entity.type]
          );
          
          if (existingEntityResult.rows.length === 0) {
            const entityEmbedding = await generateEmbedding(
              `${entity.name} ${entity.type} ${entity.description || ''}`
            );
            
            await pool.query(
              `INSERT INTO kg_entities (name, entity_type, description, metadata, embedding_json) 
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (name) DO NOTHING`,
              [
                entity.name,
                entity.type,
                entity.description,
                JSON.stringify(entity.metadata || {}),
                JSON.stringify(entityEmbedding)
              ]
            );
            console.log(`    + New entity: ${entity.name} (${entity.type})`);
          }
        } catch (error) {
          console.error(`    ! Error processing entity ${entity.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`  ! Error extracting entities:`, error);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing document ${doc.title}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Local OrcaSlicer Wiki Ingestion');
  console.log('='.repeat(50));
  
  const wikiDir = path.join(__dirname, '..', 'OrcaSlicer.wiki');
  
  // Check if wiki directory exists
  try {
    await fs.access(wikiDir);
  } catch (error) {
    console.error(`❌ Wiki directory not found: ${wikiDir}`);
    console.log('Please ensure the OrcaSlicer.wiki folder exists in the project root.');
    process.exit(1);
  }
  
  console.log(`📁 Reading from: ${wikiDir}\n`);
  
  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(wikiDir);
  console.log(`📄 Found ${markdownFiles.length} markdown files\n`);
  
  // Process each file
  let processed = 0;
  let failed = 0;
  
  for (const filePath of markdownFiles) {
    const processedFile = await processMarkdownFile(filePath, wikiDir);
    
    if (processedFile) {
      const success = await processDocument(processedFile);
      if (success) {
        processed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  }
  
  // Summary statistics
  const docCountResult = await pool.query('SELECT COUNT(*) FROM documents');
  const entityCountResult = await pool.query('SELECT COUNT(*) FROM kg_entities');
  const relationCountResult = await pool.query('SELECT COUNT(*) FROM kg_relationships');
  
  console.log('\n📊 Final Statistics:');
  console.log(`   Files processed: ${processed}`);
  console.log(`   Files failed: ${failed}`);
  console.log(`   Total documents in DB: ${docCountResult.rows[0].count}`);
  console.log(`   Total entities in DB: ${entityCountResult.rows[0].count}`);
  console.log(`   Total relationships in DB: ${relationCountResult.rows[0].count}`);
  
  console.log('\n✅ Local wiki ingestion complete!');
  
  // Create a backup record
  const backupInfo = {
    date: new Date().toISOString(),
    documentsCount: docCountResult.rows[0].count,
    entitiesCount: entityCountResult.rows[0].count,
    processedFiles: processed,
    wikiPath: wikiDir,
  };
  
  await fs.writeFile(
    path.join(__dirname, '..', 'wiki-ingestion-log.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log('📝 Backup info saved to wiki-ingestion-log.json');
  
  // Close pool connection
  await pool.end();
  process.exit(0);
}

// Run the ingestion
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await pool.end();
  process.exit(1);
});
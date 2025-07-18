import { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { openai as openaiProvider } from '@ai-sdk/openai';
import { z } from 'zod';
import { Client } from 'pg';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database connection
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });
  await client.connect();
  return client;
}

// Request schema validation
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  sessionId: z.string().uuid().optional(),
});

// Enable CORS
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  let client;
  try {
    client = await getDbClient();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
  try {
    const body = req.body;
    const { messages, sessionId } = requestSchema.parse(body);
    
    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const sessionResult = await client.query(
        'INSERT INTO chat_sessions (metadata) VALUES ($1) RETURNING id',
        [JSON.stringify({ startTime: new Date().toISOString() })]
      );
      currentSessionId = sessionResult.rows[0].id;
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }
    
    // Store user message
    await client.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [currentSessionId, 'user', lastMessage.content]
    );
    
    // Hybrid search for better context retrieval
    let context = '';
    try {
      // Try to use hybrid search if embeddings are available
      const { hybridSearch } = await import('../src/lib/utils/vectorSearch');
      const searchResults = await hybridSearch(lastMessage.content, 5);
      
      if (searchResults.length > 0) {
        context = 'Relevant information:\n\n';
        for (const result of searchResults) {
          context += `${result.title}\n${result.content.substring(0, 500)}...\n\n`;
        }
      }
    } catch (error) {
      console.log('Hybrid search failed, falling back to text search:', error);
      
      // Fallback to simple text search
      const searchResults = await client.query(
        `SELECT title, content, metadata 
         FROM documents 
         WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
         LIMIT 5`,
        [lastMessage.content]
      );
      
      if (searchResults.rows.length > 0) {
        context = 'Relevant information:\n\n';
        for (const result of searchResults.rows) {
          context += `${result.title}\n${result.content.substring(0, 500)}...\n\n`;
        }
      }
    }
    
    // System prompt
    const systemPrompt = `You are an expert OrcaSlicer assistant specializing in 3D printing calibration, troubleshooting, and settings optimization. 
    You provide accurate, helpful information based on the context provided and your knowledge of 3D printing.
    
    Key areas of expertise:
    - OrcaSlicer settings and configuration
    - Calibration procedures (flow ratio, temperature, pressure advance, retraction)
    - Troubleshooting print quality issues
    - Material-specific recommendations
    - Printer optimization
    
    ${context ? `Context:\n${context}` : ''}
    
    Guidelines:
    - Be specific and reference exact settings when possible
    - Provide step-by-step instructions for procedures
    - Mention relevant calibration tests when appropriate
    - If unsure, acknowledge limitations rather than guessing
    - Keep responses concise but comprehensive`;
    
    // Generate streaming response
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: true,
    });
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Session-ID', currentSessionId);
    
    let fullResponse = '';
    
    // Stream the response
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    // Store assistant response
    await client.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [currentSessionId, 'assistant', fullResponse]
    );
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request format', details: error.errors });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.end();
  }
}
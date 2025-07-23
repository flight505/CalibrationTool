import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { withClient } from '../src/lib/db/pool';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  try {
    // Parse request body - it's already parsed by Vercel
    const { messages, id } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array required');
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Use the chat ID from useChat hook as session ID, or generate a new one
    let sessionId = id || uuidv4();
    
    // Validate session ID is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      sessionId = uuidv4();
    }
    
    console.log('Chat session ID:', sessionId);
    
    // Try to store user message (non-blocking)
    let dbAvailable = true;
    try {
      await withClient(async (client) => {
        // Use a transaction to ensure atomicity
        await client.query('BEGIN');
        
        try {
          // First, ensure the session exists
          const sessionResult = await client.query(
            `INSERT INTO chat_sessions (id, metadata) 
             VALUES ($1, $2::jsonb) 
             ON CONFLICT (id) DO UPDATE 
             SET updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [sessionId, JSON.stringify({ userAgent: req.headers['user-agent'] || 'unknown' })]
          );
          
          console.log('Session upserted:', sessionResult.rows[0].id);
          
          // Then insert the message
          await client.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
            [sessionId, 'user', lastMessage.content]
          );
          
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      });
    } catch (dbError) {
      console.error('Database unavailable for message storage:', dbError);
      dbAvailable = false;
    }

    // Hybrid search for context
    let context = '';
    if (dbAvailable) {
      try {
        // Try vector search first
        const { hybridSearch } = await import('../src/lib/utils/vectorSearch.js');
        const searchResults = await hybridSearch(lastMessage.content, 5);
        
        if (searchResults.length > 0) {
          context = 'Relevant information from OrcaSlicer documentation:\n\n';
          for (const result of searchResults) {
            context += `${result.title}:\n${result.content.substring(0, 500)}...\n\n`;
          }
        }
      } catch (error) {
        console.log('Vector search failed, trying text search:', error);
        
        try {
          // Fallback to text search
          const searchResults = await withClient(async (client) => {
            return await client.query(
              `SELECT title, content 
               FROM documents 
               WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
               LIMIT 5`,
              [lastMessage.content]
            );
          });
          
          if (searchResults.rows.length > 0) {
            context = 'Relevant information from OrcaSlicer documentation:\n\n';
            for (const result of searchResults.rows) {
              context += `${result.title}:\n${result.content.substring(0, 500)}...\n\n`;
            }
          }
        } catch (dbError) {
          console.error('Text search also failed:', dbError);
          dbAvailable = false;
        }
      }
    }

    // Check if we have context
    const hasContext = context && context.trim().length > 0;
    
    // System prompt with improved fallback handling
    const systemPrompt = `You are an expert OrcaSlicer assistant specializing in 3D printing calibration, troubleshooting, and settings optimization. 
    You provide accurate, helpful information based on the context provided and your extensive knowledge of 3D printing.
    
    Key areas of expertise:
    - OrcaSlicer settings and configuration
    - Calibration procedures (flow ratio, temperature, pressure advance, retraction)
    - Troubleshooting print quality issues
    - Material-specific recommendations
    - Printer optimization
    
    ${hasContext ? `Context from OrcaSlicer documentation:\n${context}` : dbAvailable ? 'Note: No specific documentation found in the knowledge base. Using general 3D printing expertise and OrcaSlicer knowledge to help you.' : 'Note: Database is currently unavailable. Using general 3D printing expertise and OrcaSlicer knowledge to help you.'}
    
    Guidelines:
    - Be specific and reference exact settings when possible
    - Provide step-by-step instructions for procedures
    - Mention relevant calibration tests when appropriate
    - If no specific context is available, use your general knowledge of OrcaSlicer and 3D printing best practices
    - Always try to be helpful and provide actionable advice
    - For calibration questions, provide typical value ranges and explain the calibration process
    - Keep responses concise but comprehensive`;

    // Use GPT-4o-mini for cost efficiency and speed
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Set up SSE headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    });

    // Stream the response
    let fullResponse = '';
    
    try {
      for await (const textPart of result.textStream) {
        fullResponse += textPart;
        
        // Send SSE formatted data
        const data = JSON.stringify({ 
          text: textPart,
          type: 'text'
        });
        res.write(`data: ${data}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      
      // Try to store the complete response in database (non-blocking)
      if (fullResponse && dbAvailable) {
        try {
          await withClient(async (client) => {
            // Ensure session still exists (in case it was created earlier but deleted)
            await client.query(
              `INSERT INTO chat_sessions (id, created_at, updated_at, metadata) 
               VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{}') 
               ON CONFLICT (id) DO UPDATE 
               SET updated_at = CURRENT_TIMESTAMP`,
              [sessionId]
            );
            
            // Then insert the assistant message
            await client.query(
              'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
              [sessionId, 'assistant', fullResponse]
            );
          });
        } catch (dbError) {
          console.error('Failed to store assistant response:', dbError);
        }
      }
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: 'Stream interrupted' 
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('Chat API error:', error);
    
    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      // If streaming has started, send error through SSE
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })}\n\n`);
      res.end();
    }
  } finally {
    // Connection cleanup is handled by the pool
  }
}
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Client } from 'pg';

// Database connection helper
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });
  await client.connect();
  return client;
}

export default async function handler(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let client: Client | null = null;

  try {
    // Parse request body
    const { messages } = await req.json();

    // Get database client
    client = await getDbClient();

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Create or get session
    let sessionId = messages[0]?.id || 'default-session';
    
    // Store user message
    await client.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', lastMessage.content]
    );

    // Hybrid search for context
    let context = '';
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
      console.log('Vector search failed, using text search:', error);
      
      // Fallback to text search
      const searchResults = await client.query(
        `SELECT title, content 
         FROM documents 
         WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
         LIMIT 5`,
        [lastMessage.content]
      );
      
      if (searchResults.rows.length > 0) {
        context = 'Relevant information from OrcaSlicer documentation:\n\n';
        for (const result of searchResults.rows) {
          context += `${result.title}:\n${result.content.substring(0, 500)}...\n\n`;
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

    // Use GPT-4o-mini for cost efficiency and speed
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Store the response in database asynchronously
    (async () => {
      try {
        let fullResponse = '';
        const reader = result.textStream.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) fullResponse += value;
        }
        
        if (fullResponse && client) {
          await client.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
            [sessionId, 'assistant', fullResponse]
          );
        }
      } catch (error) {
        console.error('Error storing assistant response:', error);
      } finally {
        // Clean up database connection
        if (client) {
          try {
            await client.end();
          } catch (error) {
            console.error('Error closing client:', error);
          }
        }
      }
    })();

    // Return the streaming response
    return result.toDataStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Clean up database connection on error
    if (client) {
      try {
        await client.end();
      } catch (error) {
        console.error('Error closing client:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
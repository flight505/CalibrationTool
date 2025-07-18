import { streamText } from 'ai';
import { openai as openaiProvider } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db/client';
import { DualLevelRetrieval } from '@/lib/lightrag/retrieval';
import { EntityExtractor } from '@/lib/lightrag/entityExtractor';

// Request schema validation
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  sessionId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = requestSchema.parse(body);
    
    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const sessionResult = await query(
        'INSERT INTO chat_sessions (metadata) VALUES ($1) RETURNING id',
        [JSON.stringify({ startTime: new Date().toISOString() })]
      );
      currentSessionId = sessionResult.rows[0].id;
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }
    
    // Store user message
    await query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [currentSessionId, 'user', lastMessage.content]
    );
    
    // Perform retrieval
    const retrieval = new DualLevelRetrieval();
    const retrievalResults = await retrieval.hybridRetrieve(lastMessage.content, 10);
    
    // Build context from retrieval results
    let context = '';
    if (retrievalResults.length > 0) {
      context = 'Relevant information:\n\n';
      
      for (const result of retrievalResults) {
        if (result.type === 'document') {
          context += `Document: ${result.title}\n`;
          context += `${result.content?.substring(0, 500)}...\n\n`;
        } else if (result.type === 'entity') {
          context += `${result.name} (${result.metadata?.type || 'entity'}): ${result.description}\n\n`;
        }
      }
    }
    
    // Extract entities from the conversation (async, don't wait)
    const extractor = new EntityExtractor();
    extractor.extractEntities(lastMessage.content).then(async (entities) => {
      for (const entity of entities) {
        await extractor.storeEntity(entity);
      }
    }).catch(console.error);
    
    // System prompt
    const systemPrompt = `You are an expert OrcaSlicer assistant specializing in 3D printing calibration, troubleshooting, and settings optimization. 
    You provide accurate, helpful information based on the context provided and your knowledge of 3D printing.
    
    Key areas of expertise:
    - OrcaSlicer settings and configuration
    - Calibration procedures (flow rate, temperature, pressure advance, retraction)
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
    
    // Stream response
    const result = await streamText({
      model: openaiProvider('gpt-4-turbo-preview'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.3,
      maxTokens: 2000,
      onFinish: async ({ text }) => {
        // Store assistant response
        await query(
          'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
          [currentSessionId, 'assistant', text]
        );
      },
    });
    
    // Add session ID to response headers
    const response = result.toAIStreamResponse();
    response.headers.set('X-Session-ID', currentSessionId);
    
    return response;
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
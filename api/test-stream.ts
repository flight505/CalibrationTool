import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  try {
    const { message } = await req.json();
    
    console.log('Test stream request:', message);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: 'Respond with exactly: "Test successful!"',
        },
        {
          role: 'user',
          content: message || 'Hello!',
        },
      ],
      temperature: 0,
      maxTokens: 10,
    });

    console.log('Returning stream response...');

    return result.toDataStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Test stream error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Stream test failed',
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
import { openai } from '@ai-sdk/openai';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ 
        error: 'OpenAI API key not configured',
        hasKey: false,
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log('Testing OpenAI API...');
    
    // Test a simple completion without streaming
    const result = await openai('gpt-4o-mini').doGenerate({
      inputFormat: 'messages',
      mode: { type: 'regular' },
      prompt: [
        {
          role: 'user',
          content: 'Say "API test successful" and nothing else.',
        },
      ],
      temperature: 0,
      maxTokens: 10,
    });

    console.log('OpenAI API test completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        hasKey: true,
        keyLength: process.env.OPENAI_API_KEY.length,
        response: result.text,
        usage: result.usage,
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
    console.error('OpenAI API test failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        hasKey: true,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
        error: error.message,
        type: error.name,
        code: error.code,
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
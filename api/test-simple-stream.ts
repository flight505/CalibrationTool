import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { message } = req.body;
    
    console.log('Simple stream test:', message);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with exactly: "Streaming test successful!"',
        },
        {
          role: 'user',
          content: message || 'Hello!',
        },
      ],
      temperature: 0,
      maxTokens: 20,
    });

    console.log('Returning direct stream response...');

    // Get the direct stream response
    const streamResponse = result.toDataStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

    // Convert to VercelResponse
    const response = await streamResponse;
    
    // Copy all headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Set status
    res.status(response.status);
    
    // Stream the response body directly
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    res.end();

  } catch (error) {
    console.error('Simple stream error:', error);
    
    return res.status(500).json({ 
      error: 'Simple stream test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
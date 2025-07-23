export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message } = await req.json();
    console.log('Mock stream request:', message);

    // Create a simple mock stream without OpenAI
    const mockResponse = `Hello! This is a mock streaming response to test the format. You said: "${message || 'nothing'}". The streaming system appears to be working correctly!`;
    
    // Create a readable stream that simulates AI streaming
    const stream = new ReadableStream({
      start(controller) {
        const words = mockResponse.split(' ');
        let index = 0;
        
        const sendNext = () => {
          if (index < words.length) {
            const chunk = words[index] + ' ';
            const data = JSON.stringify({
              type: 'text',
              content: chunk,
            });
            controller.enqueue(`data: ${data}\n\n`);
            index++;
            setTimeout(sendNext, 50); // Simulate typing delay
          } else {
            controller.enqueue(`data: [DONE]\n\n`);
            controller.close();
          }
        };
        
        sendNext();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Mock stream error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Mock stream test failed',
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
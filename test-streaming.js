const GATEWAY_URL = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freeloader-local';

async function testStreaming() {
  console.log(`🚀 Starting Streaming Test...`);
  const startTime = Date.now();

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        stream: true, // Requesting SSE Streaming!
        messages: [{ role: 'user', content: 'Write a short 3-line poem about the ocean.' }]
      })
    });

    if (!response.ok) {
      console.log(`❌ Request failed: ${response.status}`);
      return;
    }

    console.log(`📡 Connected to Stream. Receiving tokens...\n`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse the SSE chunk lines
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line === 'data: [DONE]') {
            console.log(`\n\n✅ Stream Complete! Latency: ${Date.now() - startTime}ms`);
            return;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.choices[0]?.delta?.content || '';
              process.stdout.write(text); // Print token by token exactly as they arrive
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`\n💥 Network Error: ${error.message}`);
  }
}

testStreaming();

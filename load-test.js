const GATEWAY_URL = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freeloader-local';
const NUM_REQUESTS = 15;

async function sendRequest(index) {
  const startTime = Date.now();
  console.log(`[Request ${index}] Sending...`);
  
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Give me a 1 sentence random fact. (Request ${index})` }]
      })
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`[Request ${index}] ✅ Success! Latency: ${latency}ms | Provider: ${data.provider_used || 'Unknown'} | Tokens: ${data.usage?.total_tokens || 0}`);
    } else {
      console.log(`[Request ${index}] ❌ Failed! Latency: ${latency}ms | Error: ${JSON.stringify(data.error)}`);
    }
  } catch (error) {
    console.log(`[Request ${index}] 💥 Network Error! ${error.message}`);
  }
}

async function runLoadTest() {
  console.log(`🚀 Starting Freeloader Load Test (${NUM_REQUESTS} requests)`);
  console.log(`Make sure you are watching the Live Dashboard at http://localhost:3001 !\n`);
  
  const promises = [];
  
  // Fire off a bunch of concurrent requests
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    // Add a slight random stagger between requests (0 to 1000ms) to simulate real traffic
    const delay = Math.random() * 1000;
    promises.push(
      new Promise(resolve => setTimeout(() => resolve(sendRequest(i)), delay))
    );
  }
  
  await Promise.all(promises);
  console.log(`\n🎉 Load Test Complete! Check your Dashboard!`);
}

runLoadTest();

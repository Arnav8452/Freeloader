const GATEWAY_URL = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freeloader-local';

const providersToTest = [
  'gemini',
  'groq',
  'cerebras',
  'openrouter'
];

async function testProvider(provider) {
  const startTime = Date.now();
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // The gateway will resolve this to the provider's specific model
        provider: provider,   // Forcing the provider
        messages: [{ role: 'user', content: `Respond with exactly one word for the following test: ${provider}` }]
      })
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ [${provider}]`);
      console.log(`   Actual Model:  ${data.model}`);
      console.log(`   Latency:       ${latency}ms`);
      console.log(`   Tokens:        ${data.usage?.total_tokens || 0}`);
      console.log(`   Response:      ${data.choices?.[0]?.message?.content?.trim()}`);
    } else {
      console.log(`❌ [${provider}] Failed in ${latency}ms`);
      console.log(`   Error: ${JSON.stringify(data.error)}`);
    }
  } catch (error) {
    console.log(`💥 [${provider}] Network Error: ${error.message}`);
  }
  console.log('-----------------------------------');
}

async function runTests() {
  console.log(`🚀 Testing all configured providers...\n`);
  for (const provider of providersToTest) {
    await testProvider(provider);
  }
  console.log(`🎉 All tests complete!`);
}

runTests();

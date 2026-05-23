const GATEWAY_URL = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freeloader-local';

const modelsToTest = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'claude-3-5-sonnet'
];

async function testModel(model) {
  const startTime = Date.now();
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: `Respond with exactly one word for the following test: ${model}` }]
      })
    });

    const data = await response.json();
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ [${model}]`);
      console.log(`   Provider Used: ${data.provider_used}`);
      console.log(`   Actual Model:  ${data.model}`);
      console.log(`   Latency:       ${latency}ms`);
      console.log(`   Tokens:        ${data.usage?.total_tokens || 0}`);
      console.log(`   Response:      ${data.choices?.[0]?.message?.content?.trim()}`);
    } else {
      console.log(`❌ [${model}] Failed in ${latency}ms`);
      console.log(`   Error: ${JSON.stringify(data.error)}`);
    }
  } catch (error) {
    console.log(`💥 [${model}] Network Error: ${error.message}`);
  }
  console.log('-----------------------------------');
}

async function runTests() {
  console.log(`🚀 Testing all mapped models sequentially...\n`);
  for (const model of modelsToTest) {
    await testModel(model);
  }
  console.log(`🎉 All tests complete!`);
}

runTests();

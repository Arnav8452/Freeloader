import { PipelineOrchestrator, GatewayRequest } from '@freeloader/core';
import { GeminiAdapter, GroqAdapter } from '@freeloader/adapters';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function run() {
  const providers = [
    new GeminiAdapter(),
    new GroqAdapter()
  ];

  const pipeline = new PipelineOrchestrator(providers, {
    gemini: 1.0,
    groq: 1.0
  });

  const request: GatewayRequest = {
    model: 'gpt-4o-mini', // Should route to Gemini Flash or Groq Llama3
    messages: [
      { role: 'user', content: 'What is the capital of France? Reply in exactly one word.' }
    ],
    stream: false
  };

  console.log('--- STARTING NON-STREAMING E2E TEST ---');
  try {
    const response = await pipeline.execute(request);
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('Provider Used:', response.provider_used);
    console.log('Latency:', response.latency_ms, 'ms');
  } catch (err: any) {
    console.error('Test Failed:', err.message);
  }

  const streamReq = { ...request, stream: true, messages: [{ role: 'user', content: 'Count from 1 to 5' }] };
  console.log('\n--- STARTING STREAMING E2E TEST ---');
  try {
    const stream = pipeline.executeStream(streamReq);
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n[Stream Finished]');
  } catch (err: any) {
    console.error('\nStream Test Failed:', err.message);
  }
}

run();

import { executors } from '@freeloaderapi/omniroute-compat/dist/index';
import { OmniRouteWrapperAdapter } from '../../packages/adapters/src/omniRouteWrapper.ts';

async function test() {
    const executor = executors["duckduckgo-web"];
    const adapter = new OmniRouteWrapperAdapter(executor);
    
    console.log(`Testing adapter: ${adapter.name}`);
    
    const stream = await adapter._chatCompletionStream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'What is 2+2? Reply short.' }],
        stream: true,
        temperature: 0,
        max_tokens: 100
    });
    
    for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            process.stdout.write(chunk.choices[0].delta.content);
        }
    }
    console.log('\nDone.');
}
test().catch(console.error);

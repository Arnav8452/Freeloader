const GATEWAY_URL = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freeloader-local';
const CONCURRENCY = 20;

async function runBenchmark() {
  console.log(`🚀 Starting Freeloader Benchmark (${CONCURRENCY} concurrent requests)...`);
  const startTime = Date.now();
  
  const promises = [];
  
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push((async () => {
      const reqStart = Date.now();
      try {
        const response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Reply with the word "Success".' }]
          })
        });

        const data = await response.json();
        const latency = Date.now() - reqStart;
        
        if (response.ok) {
          return { status: 'success', latency, provider: data.provider_used, tokens: data.usage?.total_tokens || 0 };
        } else {
          return { status: 'failed', latency, error: data.error };
        }
      } catch (err) {
        return { status: 'error', latency: Date.now() - reqStart, error: err.message };
      }
    })());
  }

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');
  
  const providerStats = {};
  let totalLatency = 0;
  let totalTokens = 0;
  
  successful.forEach(r => {
    providerStats[r.provider] = (providerStats[r.provider] || 0) + 1;
    totalLatency += r.latency;
    totalTokens += r.tokens;
  });

  const avgLatency = successful.length > 0 ? Math.round(totalLatency / successful.length) : 0;
  const tps = totalTime > 0 ? (totalTokens / (totalTime / 1000)).toFixed(2) : 0;
  const rps = (CONCURRENCY / (totalTime / 1000)).toFixed(2);
  
  console.log(`\n✅ Benchmark Complete!\n`);
  
  console.log('Here is the Markdown table for your README:\n');
  console.log('### Performance Metrics');
  console.log('| Metric | Result |');
  console.log('|---|---|');
  console.log(`| **Total Requests** | ${CONCURRENCY} |`);
  console.log(`| **Concurrency** | ${CONCURRENCY} parallel |`);
  console.log(`| **Success Rate** | ${Math.round((successful.length / CONCURRENCY) * 100)}% |`);
  console.log(`| **Average Latency** | ${avgLatency}ms |`);
  console.log(`| **Throughput (Req/sec)** | ${rps} req/s |`);
  console.log(`| **Throughput (Tokens/sec)** | ${tps} tok/s |`);
  console.log(`| **Provider Failover Used** | ${Object.keys(providerStats).length > 1 ? 'Yes' : 'No'} (${Object.keys(providerStats).join(', ')}) |`);
  
  console.log('\nCopy and paste this into your README.md to show off the routing engine!');
}

runBenchmark();

import { FastifyInstance } from 'fastify';
import { PipelineOrchestrator, GatewayRequest } from '@freeloaderapi/core';
import { GeminiAdapter, GroqAdapter, OpenRouterAdapter, OllamaAdapter, CerebrasAdapter } from '@freeloaderapi/adapters';

const providers = [
  new GeminiAdapter(),
  new GroqAdapter(),
  new CerebrasAdapter(),
  new OpenRouterAdapter(),
  new OllamaAdapter()
];

// Initialize pipeline with some example weightings
const pipeline = new PipelineOrchestrator(providers, {
  gemini: 1.5, // Prefer gemini slightly
  ollama: 0.5  // Fallback
});

export default async function (fastify: FastifyInstance) {
  fastify.post('/v1/chat/completions', async (request, reply) => {
    const gatewayReq = request.body as GatewayRequest;

    if (gatewayReq.stream) {
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      let heartbeat: NodeJS.Timeout | undefined;
      try {
        // Send a heartbeat every 15 seconds to keep proxies from closing the connection
        heartbeat = setInterval(() => {
          reply.raw.write(': keep-alive\n\n');
        }, 15000);

        const stream = pipeline.executeStream(gatewayReq);
        for await (const chunk of stream) {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        reply.raw.write('data: [DONE]\n\n');
      } catch (err: any) {
        request.log.error(err);
        if (!reply.raw.headersSent) {
          reply.status(500).send({ error: { message: err.message } });
        } else {
          // Send an error chunk if stream already started
          reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          reply.raw.end();
        }
      } finally {
        if (heartbeat) clearInterval(heartbeat);
        reply.raw.end();
      }
    } else {
      try {
        const response = await pipeline.execute(gatewayReq);
        return reply.send(response);
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({ error: { message: err.message } });
      }
    }
  });
}

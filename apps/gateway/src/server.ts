import fastify from 'fastify';
import { authMiddleware } from './middleware/auth.js';
import completionsRoute from './routes/v1/chat/completions.js';
import { metricsRoutes } from './routes/v1/metrics.js';
import cors from '@fastify/cors';

const server = fastify({ logger: true });

// Enable CORS for the dashboard
server.register(cors, {
  origin: '*', // Allow dashboard to fetch
});

// Register Auth Middleware globally
server.addHook('preHandler', async (request, reply) => {
  // Exclude health and metrics endpoints from auth
  if (request.url.startsWith('/health') || request.url.startsWith('/v1/metrics')) return;
  await authMiddleware(request, reply);
});

server.get('/health', async (request, reply) => {
  return { status: 'ok', uptime: process.uptime() };
});

server.register(completionsRoute);
server.register(metricsRoutes);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Freeloader Gateway listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

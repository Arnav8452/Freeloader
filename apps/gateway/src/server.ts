import fastify from 'fastify';

const server = fastify({ logger: true });

server.get('/health', async (request, reply) => {
  return { status: 'ok', uptime: process.uptime() };
});

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

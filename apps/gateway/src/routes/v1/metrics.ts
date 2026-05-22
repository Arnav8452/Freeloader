import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MetricsLogger, CircuitBreaker } from '@freeloaderapi/core';

export const metricsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/stats', async (request, reply) => {
    try {
      const stats = await MetricsLogger.getDashboardMetrics();
      const circuitBreakers = await CircuitBreaker.getActiveBreakers();

      return reply.send({
        ...stats,
        circuitBreakersOpen: circuitBreakers.length,
        circuitBreakersList: circuitBreakers
      });
    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch metrics' });
    }
  });
};

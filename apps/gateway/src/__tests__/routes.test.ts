import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fastify, { FastifyInstance } from 'fastify';

import RedisMock from 'ioredis-mock';
import { RedisClient } from '@freeloaderapi/core';

// Ensure the mock is set up before we import the middleware
const mockRedis = new RedisMock();
RedisClient.getInstance = () => mockRedis;

describe('Gateway Routes', () => {
  let app: FastifyInstance;

  before(async () => {
    // Dynamically import so the mock takes effect before the module evaluates
    const { authMiddleware } = await import('../middleware/auth');
    const { default: completionsRoute } = await import('../routes/v1/chat/completions');

    app = fastify();
    app.addHook('preHandler', authMiddleware);
    app.register(completionsRoute, { prefix: '/v1/chat/completions' });
    await app.ready();
  });

  after(async () => {
    if (app) await app.close();
  });

  test('rejects missing authorization header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      payload: { model: 'gpt-4o' }
    });
    
    assert.strictEqual(response.statusCode, 401);
  });
});

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { CircuitBreaker, CircuitBreakerState } from '../circuit-breaker';
import { RateLimiter } from '../rate-limiter';
import { CacheManager } from '../cache/CacheManager';
import { MemoryCache } from '../cache/MemoryCache';
import RedisMock from 'ioredis-mock';
import { RedisCache } from '../cache/RedisCache';

const providers = [
  { name: 'MemoryCache', create: () => new MemoryCache() },
  { name: 'RedisCache', create: () => new RedisCache(new RedisMock() as any) }
];

for (const provider of providers) {
  describe(`CircuitBreaker (${provider.name})`, () => {
    beforeEach(async () => {
      CacheManager.setInstance(provider.create());
    });

    it('starts in CLOSED state', async () => {
      const cb = new CircuitBreaker('test-provider');
      const state = await cb.getState();
      assert.equal(state, CircuitBreakerState.CLOSED);
    });

    it('opens circuit after reaching failure threshold', async () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 3, recoveryTimeoutMs: 1000 });

      await cb.recordFailure();
      await cb.recordFailure();
      assert.equal(await cb.getState(), CircuitBreakerState.CLOSED);

      await cb.recordFailure();
      assert.equal(await cb.getState(), CircuitBreakerState.OPEN);

      await assert.rejects(() => cb.acquireTicket(), /OPEN/);
    });

    it('transitions to HALF_OPEN after recovery timeout', async () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, recoveryTimeoutMs: 100 });

      await cb.recordFailure();
      assert.equal(await cb.getState(), CircuitBreakerState.OPEN);

      await new Promise(resolve => setTimeout(resolve, 150));

      assert.equal(await cb.getState(), CircuitBreakerState.HALF_OPEN);

      await cb.acquireTicket();
      await assert.rejects(() => cb.acquireTicket(), /HALF_OPEN/);
    });

    it('closes circuit if probe succeeds', async () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, recoveryTimeoutMs: 100 });
      await cb.recordFailure();

      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal(await cb.getState(), CircuitBreakerState.HALF_OPEN);

      await cb.recordSuccess();
      assert.equal(await cb.getState(), CircuitBreakerState.CLOSED);
    });
  });

  describe(`RateLimiter (${provider.name})`, () => {
    beforeEach(async () => {
      CacheManager.setInstance(provider.create());
    });

    it('allows requests under limit', async () => {
      const limiter = new RateLimiter();
      const config = { requestsPerMinute: 2 };

      const req1 = await limiter.checkLimit('user1', config);
      assert.equal(req1.allowed, true);
      assert.equal(req1.remaining, 1);

      const req2 = await limiter.checkLimit('user1', config);
      assert.equal(req2.allowed, true);
      assert.equal(req2.remaining, 0);

      const req3 = await limiter.checkLimit('user1', config);
      assert.equal(req3.allowed, false);
      assert.equal(req3.remaining, 0);
    });
  });
}

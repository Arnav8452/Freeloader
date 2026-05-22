import RedisMock from 'ioredis-mock';
import { CircuitBreaker, CircuitBreakerState } from '../circuit-breaker';
import { RateLimiter } from '../rate-limiter';
import { RedisClient } from '../redis/client';

// Mock the Redis singleton
const mockRedis = new RedisMock();
jest.mock('../redis/client', () => {
  return {
    RedisClient: {
      getInstance: () => mockRedis
    }
  };
});

describe('CircuitBreaker', () => {
  beforeEach(async () => {
    await mockRedis.flushall();
  });

  it('starts in CLOSED state', async () => {
    const cb = new CircuitBreaker('test-provider');
    const state = await cb.getState();
    expect(state).toBe(CircuitBreakerState.CLOSED);
  });

  it('opens circuit after reaching failure threshold', async () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 3, recoveryTimeoutMs: 1000 });
    
    await cb.recordFailure();
    await cb.recordFailure();
    expect(await cb.getState()).toBe(CircuitBreakerState.CLOSED);
    
    await cb.recordFailure();
    expect(await cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Should throw on acquire
    await expect(cb.acquireTicket()).rejects.toThrow(/OPEN/);
  });

  it('transitions to HALF_OPEN after recovery timeout', async () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, recoveryTimeoutMs: 100 }); // 100ms
    
    await cb.recordFailure();
    expect(await cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(await cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

    // Should allow exactly one probe request
    await cb.acquireTicket();
    await expect(cb.acquireTicket()).rejects.toThrow(/HALF_OPEN/); // Second ticket should fail
  });

  it('closes circuit if probe succeeds', async () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, recoveryTimeoutMs: 100 });
    await cb.recordFailure();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(await cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

    await cb.recordSuccess();
    expect(await cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});

describe('RateLimiter', () => {
  beforeEach(async () => {
    await mockRedis.flushall();
  });

  it('allows requests under limit', async () => {
    const limiter = new RateLimiter();
    const config = { requestsPerMinute: 2, burstLimit: 2 };
    
    const req1 = await limiter.checkLimit('user1', config);
    expect(req1.allowed).toBe(true);
    expect(req1.remaining).toBe(1);

    const req2 = await limiter.checkLimit('user1', config);
    expect(req2.allowed).toBe(true);
    expect(req2.remaining).toBe(0);

    const req3 = await limiter.checkLimit('user1', config);
    expect(req3.allowed).toBe(false);
    expect(req3.remaining).toBe(0);
  });
});

import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from '@freeloader/core';
import crypto from 'crypto';

const rateLimiter = new RateLimiter();

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: {
        message: 'Missing or invalid Authorization header',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    });
  }

  const apiKey = authHeader.split(' ')[1];
  
  // Basic security: hash the incoming key and compare against allowed hashed keys in env
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  const allowedKeys = (process.env.FREELOADER_API_KEYS || '').split(',').map(k => k.trim());

  if (!allowedKeys.includes(hashedKey)) {
    return reply.status(401).send({
      error: {
        message: 'Incorrect API key provided',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    });
  }

  // Inject the hashed key into the request object for downstream usage
  (request as any).user = {
    apiKeyHash: hashedKey
  };

  // 2. Distributed Rate Limiting
  try {
    const config = {
      requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM || '60', 10),
      burstLimit: parseInt(process.env.RATE_LIMIT_BURST || '100', 10),
    };

    const limitCheck = await rateLimiter.checkLimit(hashedKey, config);
    
    // Set informative rate limit headers
    reply.header('X-RateLimit-Limit', config.requestsPerMinute);
    reply.header('X-RateLimit-Remaining', limitCheck.remaining);

    if (!limitCheck.allowed) {
      return reply.status(429).send({
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded'
        }
      });
    }
  } catch (err) {
    request.log.error('Rate limiter failed, failing open for availability', err);
    // In infrastructure, if Redis fails, you typically fail open (allow request) to prevent total outages
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { getPromptCache, LRUCache } from '@freeloaderapi/omniroute-compat/src/lib/cacheLayer.js';

export async function cacheMiddleware(request: FastifyRequest, reply: FastifyReply) {
    if (request.method !== 'POST') return;

    const cache = getPromptCache();
    const body = request.body as Record<string, unknown>;
    
    // Only cache if temperature is 0 or user specifically requested
    if (body && (body.temperature === 0 || body.temperature === 0.0)) {
        const cacheKey = LRUCache.generateKey(body);
        const cachedResponse = cache.get(cacheKey);
        
        if (cachedResponse) {
            request.log.info(`[Cache] HIT for key ${cacheKey}`);
            reply.header('X-Cache', 'HIT');
            return reply.send(cachedResponse);
        }
        
        // Mark request context so response can be cached later
        (request as any).cacheKey = cacheKey;
        reply.header('X-Cache', 'MISS');
    }
}

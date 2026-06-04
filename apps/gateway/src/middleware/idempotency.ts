import { FastifyRequest, FastifyReply } from 'fastify';
import { IdempotencyLayer } from '@freeloaderapi/omniroute-compat/src/lib/idempotencyLayer.js';

const idempotency = new IdempotencyLayer();

export async function idempotencyMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const key = request.headers['idempotency-key'] as string;
    if (!key) return; // Optional

    const existing = idempotency.get(key);
    if (existing) {
        if (existing.status === 'in-progress') {
            return reply.status(409).send({ error: 'Request is currently processing' });
        }
        return reply.send(existing.response);
    }
    
    idempotency.set(key, { status: 'in-progress' });
    (request as any).idempotencyKey = key;
}

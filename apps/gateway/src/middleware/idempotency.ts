import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  getIdempotencyKey, 
  checkIdempotency, 
  saveIdempotency 
} from '@freeloaderapi/omniroute-compat/dist/src/lib/idempotencyLayer';

export async function idempotencyMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const key = getIdempotencyKey(request.headers);
    if (!key) return; // Optional

    const cached = checkIdempotency(key);
    if (cached) {
        if (cached.status === 409) {
            return reply.status(409).send({ error: 'Request is currently processing' });
        }
        return reply.status(cached.status).send(cached.response);
    }
    
    saveIdempotency(key, { error: 'Request is currently processing' }, 409);
    (request as any).idempotencyKey = key;
}

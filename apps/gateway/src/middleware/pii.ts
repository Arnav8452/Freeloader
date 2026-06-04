import { FastifyRequest, FastifyReply } from 'fastify';
import { sanitizePII } from '@freeloaderapi/omniroute-compat/dist/src/lib/piiSanitizer';

export async function piiMiddleware(request: FastifyRequest, reply: FastifyReply) {
    if (request.method !== 'POST' || !request.body) return;
    
    const body = request.body as any;
    if (body.messages && Array.isArray(body.messages)) {
        for (const msg of body.messages) {
            if (msg.content && typeof msg.content === 'string') {
                const result = sanitizePII(msg.content);
                msg.content = result.text;
                // We could also store the mapping to deanonymize later if needed
            }
        }
    }
}

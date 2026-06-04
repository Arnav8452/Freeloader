import { FastifyRequest, FastifyReply } from 'fastify';
import { PIISanitizer } from '@freeloaderapi/omniroute-compat/src/lib/piiSanitizer.js';

const sanitizer = new PIISanitizer();

export async function piiMiddleware(request: FastifyRequest, reply: FastifyReply) {
    if (request.method !== 'POST' || !request.body) return;
    
    const body = request.body as any;
    if (body.messages && Array.isArray(body.messages)) {
        for (const msg of body.messages) {
            if (msg.content && typeof msg.content === 'string') {
                const result = sanitizer.sanitize(msg.content);
                msg.content = result.sanitizedText;
                // We could also store the mapping to deanonymize later if needed
            }
        }
    }
}

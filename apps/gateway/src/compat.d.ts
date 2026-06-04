declare module '@freeloaderapi/omniroute-compat/dist/src/lib/cacheLayer' {
    export const getPromptCache: any;
    export const LRUCache: any;
}

declare module '@freeloaderapi/omniroute-compat/dist/src/lib/idempotencyLayer' {
    export const getIdempotencyKey: any;
    export const checkIdempotency: any;
    export const saveIdempotency: any;
}

declare module '@freeloaderapi/omniroute-compat/dist/src/lib/piiSanitizer' {
    export const sanitizePII: any;
}

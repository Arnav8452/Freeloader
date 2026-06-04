const esbuild = require('esbuild');

esbuild.build({
  entryPoints: [
    'src/lib/idempotencyLayer.ts',
    'src/lib/piiSanitizer.ts',
    'src/lib/cacheLayer.ts',
    'index.ts'
  ],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  logLevel: 'info',
  external: [
    '@aws-sdk/client-bedrock-runtime',
    'yazl',
    'better-sqlite3', 
    'playwright', 
    'tls-client-node', 
    'ioredis', 
    'ws', 
    'undici', 
    'fastify',
    'react',
    'next/server',
    'next/headers',
    'jsonc-parser',
    'zod',
    'zustand'
  ]
}).catch(() => process.exit(1));

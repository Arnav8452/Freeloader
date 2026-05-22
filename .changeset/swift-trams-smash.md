---
"@freeloaderapi/adapters": patch
"@freeloaderapi/core": patch
"@freeloaderapi/gateway": patch
---

feat: live dashboard metrics integration

- Integrated Redis MetricsLogger
- Added Fastify CORS dependency
- Fixed Fastify v4 CORS version mismatch
- Instrumented PipelineOrchestrator for tokens and latency

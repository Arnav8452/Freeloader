# @freeloaderapi/core

## 0.3.0

### Minor Changes

- cd38a20: feat: implement agnostic CacheProvider supporting memory and redis modes
- 1b153d3: feat: add SSE heartbeat keep-alive to gateway and idle stream abort timeouts to pipeline orchestrator

### Patch Changes

- a348b2b: feat: live dashboard metrics integration

  - Integrated Redis MetricsLogger
  - Added Fastify CORS dependency
  - Fixed Fastify v4 CORS version mismatch
  - Instrumented PipelineOrchestrator for tokens and latency

## 0.2.0

### Minor Changes

- dc505bd: Initial productized release

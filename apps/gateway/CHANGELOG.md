# @freeloaderapi/gateway

## 0.2.1

### Patch Changes

- 1b153d3: feat: add SSE heartbeat keep-alive to gateway and idle stream abort timeouts to pipeline orchestrator
- a348b2b: feat: live dashboard metrics integration

  - Integrated Redis MetricsLogger
  - Added Fastify CORS dependency
  - Fixed Fastify v4 CORS version mismatch
  - Instrumented PipelineOrchestrator for tokens and latency

- Updated dependencies [cd38a20]
- Updated dependencies [1b153d3]
- Updated dependencies [a348b2b]
  - @freeloaderapi/core@0.3.0
  - @freeloaderapi/adapters@0.2.1

## 0.2.0

### Minor Changes

- dc505bd: Initial productized release

### Patch Changes

- Updated dependencies [dc505bd]
  - @freeloaderapi/adapters@0.2.0
  - @freeloaderapi/core@0.2.0

# @freeloaderapi/core

**Core routing and resilience logic for the Freeloader AI Gateway.**

This package contains the essential components for building highly available, multi-provider AI applications:
- **Provider Selection**: intelligent quota-aware routing across multiple free tiers.
- **Circuit Breakers**: automatic failover and sandboxing for unstable providers.
- **Health Scoring**: Redis-backed monitoring of provider latency and error rates.
- **Rate Limiting & Deduplication**: preventing quota abuse and caching identical requests.

## Installation

```bash
npm install @freeloaderapi/core
```

## Usage

*This library is designed to be used internally by the Freeloader Gateway, but can be imported into custom applications.*

See the main [Freeloader Repository](https://github.com/Arnav8452/Freeloader) for full documentation.

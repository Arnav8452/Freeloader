# Freeloader

**An OpenAI-compatible AI inference gateway optimized for cost efficiency.**

Freeloader intelligently routes requests across multiple free-tier AI providers using retries, provider failover, circuit breakers, quota-aware routing, caching, health scoring, and streaming normalization.

The goal is simple: **Use AI in production without instantly burning money on API bills.**

---

## Why Freeloader Exists

As a student and indie developer, it is difficult to afford large-scale API bills, reliably find free GPU/VM instances, or maintain local inference infrastructure. Instead of relying on a single paid provider, Freeloader dynamically cascades across multiple free-tier providers to give you enterprise uptime on a $0 budget.

| Provider | Approx. Free Capacity |
| --- | --- |
| **Google AI Studio (Gemini)** | ~250-1,000 req/day |
| **Groq** | ~1,000 req/day |
| **Cerebras** | ~1M tokens/day |
| **OpenRouter (Free Models)** | ~50-200 req/day |
| **Ollama** | Local fallback (Unlimited) |

**Combined estimated free capacity:**
- ~3M-10M+ tokens/day
- ~90M-300M+ tokens/month

---

## What Freeloader Does

Freeloader acts as a unified AI gateway. Instead of your app talking directly to OpenAI, Gemini, Groq, Cerebras, or OpenRouter, it talks to Freeloader.

Freeloader then:
1. Selects the best provider based on health and quota.
2. Retries failed requests automatically.
3. Falls back to the next provider seamlessly.
4. Normalizes responses into standard OpenAI formats.
5. Streams responses using production-grade SSE.
6. Optimizes your free-tier usage.

---

## 🚀 New: OmniRoute Integration (56+ Free Tiers & Advanced Features)

Freeloader now natively wraps **OmniRoute**, unlocking access to **over 56 additional free-tier and web-based providers** directly in your gateway!

Instead of maintaining brittle web-scrapers, Freeloader uses a universal `OmniRouteWrapperAdapter` to dynamically load OmniRoute's `BaseExecutor` instances. 

**New Free Tiers Available:**
- `DuckDuckGoWeb`
- `HuggingChat`
- `Phind`
- `ChatGPT Web`
- `Claude Web`
- `DeepSeek Web`
- `Qwen Web`
- ...and 50+ more!

**New Advanced Middlewares:**
- **Idempotency Layer:** Prevents duplicate identical requests from double-processing.
- **Prompt Caching:** Exact-match caching for `temperature: 0` requests.
- **PII Sanitization:** Automatically scrubs Personally Identifiable Information from prompts before sending them to third-party providers.

### The "Forever Free" Web Providers (No API Key Required)
These are providers that OmniRoute reverse-engineers through their web interfaces or public endpoints. They require no credit card and are completely free.
- **DuckDuckGo Web** (`duckduckgo-web`) - Access to GPT-4o-mini, Claude 3 Haiku, Mixtral, and Llama 3 for free.
- **HuggingChat** (`huggingchat`) - Access to Llama 3.1 70B, Qwen 2.5 72B, and Cohere Command R+.
- **ChatGPT Web** (`chatgpt-web`) - Free tier access to ChatGPT web.
- **Claude Web** (`claude-web`) - Free tier access to Claude 3.5 Sonnet (supports auto-refresh).
- **DeepSeek Web** (`deepseek-web`) - Free access to DeepSeek V3 and R1.
- **Perplexity Web** (`perplexity-web`) - Free AI search capabilities.
- **Phind** (`phind`) - Excellent for coding questions.
- **Blackbox Web** (`blackbox-web`) - Coding-focused free LLM access.
- **V0 Vercel Web** (`v0-vercel-web`) - Vercel's UI generation AI.
- **Qwen Web** (`qwen-web`) - Direct access to Alibaba's Qwen models.
- **Kimi Web** (`kimi-web`) / **Doubao Web** (`doubao-web`) - Massive context windows.
- **Poe Web** (`poe-web`) - Access to dozens of models on Poe's free tier.

### High-Performance API Providers (Generous Free Tiers)
These are standard API providers that give you enterprise-grade reliability and massive free quotas. You just need to create a free account and grab an API key.
- **Groq** (`groq`) - The fastest inference in the world (Llama 3, Mixtral). Free tier offers ~1,000 requests/day.
- **Google Gemini** (`gemini`) - Google AI Studio gives you 1,500 requests/day of Gemini 1.5 Flash absolutely free.
- **Cerebras** (`cerebras`) - Ultra-fast Llama 3 inference. Very generous free usage limits.
- **SambaNova** (`sambanova`) - Free tier API access to Meta's Llama 3 405B and 70B models!
- **GitHub Models** (`github`) - Free LLM inference for developers with a GitHub account.
- **Cohere** (`cohere`) - Offers free "Trial Keys" for their Command R/R+ models for developers.
- **Mistral** (`mistral`) - Offers free tier limits for developers.
- **AI21 Labs** (`ai21`) - Offers free trial limits for their Jamba models.

### The Aggregators (Access to 100+ Models)
Aggregators are platforms that host models from *other* providers. Many of them have a dedicated "Free Models" section or give you free signup credits.
- **OpenRouter** (`openrouter`) - The king of aggregators. They have a massive list of models tagged as `$0.00/token` (mostly Llama, Mistral, and Gemini variants) that you can use indefinitely for free!
- **Together AI** (`together`) - Aggregator for open-source models. They give you a $5 free credit on signup which lasts a very long time for testing.
- **DeepInfra** (`deepinfra`) - Extremely cheap aggregator that provides free signup credits.
- **Fireworks AI** (`fireworks`) - Fast inference for open-source models with free trial limits.
- **Featherless AI** (`featherless-ai`) - Aggregator for running HuggingFace models.
- **Novita AI** (`novita`) - Aggregator for cheap/free inference.
- **Glhf.chat** (`glhf`) - Free tier access to open-source models.

> **Note on Dependencies:** Because the OmniRoute wrapper integrates raw source files, you must install a few native dependencies before starting the gateway:
> ```bash
> pnpm add -w xxhash-wasm zod uuid sqlite-vec
> ```

---

## Integration Methods

Freeloader is designed as a highly modular monorepo, meaning you can integrate it into your own setup in **three different ways** depending on your architecture:

### 1. As a Drop-In Gateway (Easiest & Most Secure)
Spin up the Freeloader Gateway using Docker. This approach is highly recommended because it **completely centralizes your API keys**. Your main application never needs to know your Google or Groq credentials—it only talks to your local Docker container.

First, create a `.env` file with your free-tier keys:
```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CEREBRAS_API_KEY=your_cerebras_key
OPENROUTER_API_KEY=your_openrouter_key
```

Start the gateway:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Then, change **one line of code** in your existing AI app (using LangChain, Vercel AI SDK, or the OpenAI SDK) to point to your new local gateway:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  // Point this to your Freeloader Docker container!
  baseURL: "http://localhost:3000/v1", 
  // Any placeholder works; Freeloader uses the real keys from the .env file securely on the server
  apiKey: "freeloader-local", 
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini", // Freeloader virtualizes this automatically to a free model
  messages: [{ role: "user", content: "Hello!" }],
});
```

### 2. As an NPM Library (For Custom Node.js Backends)
Because the core routing logic is decoupled from the Fastify server, you can install the packages directly into your own Next.js or Node.js backend. You can build your own custom gateways using our resilience logic!

```bash
npm install @freeloaderapi/core@^0.3.0 @freeloaderapi/adapters@^0.2.1
```

```typescript
import { FreeloaderPipeline } from '@freeloaderapi/core';
import { GeminiAdapter, GroqAdapter, CerebrasAdapter, OpenRouterAdapter } from '@freeloaderapi/adapters';

// Instantiate the pipeline natively inside your own server!
const pipeline = new FreeloaderPipeline({
  providers: [
    new GeminiAdapter({ apiKey: process.env.GOOGLE_API_KEY }),
    new CerebrasAdapter({ apiKey: process.env.CEREBRAS_API_KEY }),
    new GroqAdapter({ apiKey: process.env.GROQ_API_KEY }),
    new OpenRouterAdapter({ apiKey: process.env.OPENROUTER_API_KEY })
  ]
});

// Use it directly in your Next.js API routes or Fastify handlers
const stream = await pipeline.createChatCompletion({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }]
});
```

### 3. One-Click Cloud Deployment
Because the dashboard and gateway are built on standard Docker containers, you can securely host Freeloader entirely in the cloud with zero maintenance.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Arnav8452/Freeloader)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/custom?repo=https://github.com/Arnav8452/Freeloader)

Clicking these buttons will automatically provision the Redis instance, build the Docker container, and prompt you to securely enter your API keys during setup.

---

## Setup Guide (Local Gateway)

### Prerequisites

**1. Install Node.js**
Download the LTS version from the [Node.js Official Site](https://nodejs.org/).

**2. Install pnpm**
We use pnpm for faster, disk-efficient dependency management. See the [pnpm installation docs](https://pnpm.io/installation).
```bash
npm install -g pnpm
```

**3. Install Docker Desktop**
Docker is required to run the local Redis instance for state management. Download it from [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Get Your Free API Keys

1. **Google AI Studio (Gemini)**: Go to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
2. **Groq**: Go to the [Groq Console](https://console.groq.com/keys).
3. **Cerebras**: Go to [Cerebras Cloud](https://cloud.cerebras.ai/).
4. **OpenRouter**: Go to [OpenRouter Keys](https://openrouter.ai/keys).
5. **(Optional) Local Fallback (Ollama)**: Install [Ollama](https://ollama.com/) and run `ollama serve`.

### Installation & Run

**1. Clone the repository**
```bash
git clone YOUR_REPO_URL
cd freeloader
```

**2. Install dependencies & Build**
```bash
pnpm install
pnpm build
```

**3. Configure Environment Variables**
Create a `.env` file in the `apps/gateway` directory:
```env
GOOGLE_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
CEREBRAS_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here

OLLAMA_BASE_URL=http://localhost:11434
FREELOADER_API_KEYS=e4cd5267b2dffeb53ca1dfc0b40e5ecde2e13a0da7ca6b86ceb5853fde420281

# Cache Configuration
# Use 'memory' for a lightweight, zero-dependency setup (perfect for free-tier containers).
# Use 'redis' for multi-node, enterprise-grade distributed deployments.
CACHE_MODE=memory
# REDIS_URL=redis://localhost:6379 # Required only if CACHE_MODE=redis
```

**4. Start Infrastructure (If using Redis mode)**
```bash
# Only required if CACHE_MODE=redis
docker compose up -d
```

**5. Start Freeloader Gateway**
```bash
npm --prefix apps/gateway run start
```

**6. Start the Live Dashboard**
To visualize your routing metrics and cost savings in real-time:
```bash
pnpm --filter dashboard dev
```
Then open `http://localhost:3001` in your browser!

---

## Architecture & Features

```text
[ Your App / Agent ]
        |
        v
[ Freeloader Gateway ]
        |
        v
[ Classification & Redis Health Scoring ]
        |
        v
[ Provider Selection & Circuit Breaker ]
        |
        v
[ Gemini / Groq / Cerebras / OpenRouter / Ollama ]
```

### Core Features

- **OpenAI-Compatible:** Works instantly with existing AI tooling.
- **Automatic Provider Failover:** Switches providers mid-flight if one goes down.
- **Streaming Support:** Production-grade Server-Sent Events (SSE) streaming.
- **Circuit Breakers:** Redis-backed protection against provider instability.
- **Quota-Aware Routing:** Intelligently balances requests to optimize free tiers.
- **Redis Caching:** Eliminates duplicate requests, saving quota and latency.
- **Model Virtualization:** Request `gpt-4o-mini`, and Freeloader automatically maps it to `gemini-1.5-flash` or the best available free equivalent.

### Tech Stack

- **Core:** TypeScript, Node.js, Fastify
- **State & Resilience:** Adaptive Caching (Native Memory Map + ioredis wrappers)
- **Monorepo:** pnpm workspaces, Turborepo
- **Dashboard:** Next.js (App Router), TailwindCSS v4
- **Observability:** OpenTelemetry integration

### Production-Grade Resilience

- Distributed rate limiting & abuse protection
- Request deduplication and token accounting
- Provider health scoring and sandboxing
- Graceful degradation with detailed debug headers

---

## Vision

Freeloader is not just a "free API rotation" script. It is an **AI inference resilience infrastructure optimized for cost efficiency.**

It is built for students, indie hackers, OSS projects, AI startups, creator intelligence platforms, and anyone who needs reliable AI infrastructure without the enterprise price tag.

---

## Performance Metrics

| Metric | Result |
|---|---|
| **Total Requests** | 20 |
| **Concurrency** | 20 parallel |
| **Success Rate** | 100% |
| **Average Latency** | 1792ms |
| **Throughput (Req/sec)** | 9.43 req/s |
| **Throughput (Tokens/sec)** | 355.33 tok/s |
| **Provider Failover Used** | Yes (groq, gemini) |
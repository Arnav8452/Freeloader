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

### Drop-In Compatibility

Freeloader is strictly OpenAI-compatible. Existing tools work with almost no code changes, including:

- OpenAI SDK
- LangChain
- Vercel AI SDK
- LiteLLM
- Custom AI apps & Agents

Just change your `OPENAI_BASE_URL` and `OPENAI_API_KEY`.

---

## Setup Guide

### Prerequisites

**1. Install Node.js**

Download the LTS version from the [Node.js Official Site](https://nodejs.org/).

```bash
node -v
npm -v
```

**2. Install pnpm**

We use pnpm for faster, disk-efficient dependency management. See the [pnpm installation docs](https://pnpm.io/installation).

```bash
npm install -g pnpm
pnpm -v
```

**3. Install Docker Desktop**

Docker is required to run the local Redis instance for state management. Download it from [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker -v
```

### Get Your Free API Keys

**1. Google AI Studio (Gemini)**

- Go to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
- Sign in, click **Create API Key**, and select "Create API key in new project".

**2. Groq**

- Go to the [Groq Console](https://console.groq.com/keys).
- Create an account and generate a key.

**3. Cerebras**

- Go to [Cerebras Cloud](https://cloud.cerebras.ai/).
- Create an account and generate an inference API key.

**4. OpenRouter**

- Go to [OpenRouter Keys](https://openrouter.ai/keys).
- Create a key. Leave the credit limit blank or set a tiny limit like `$1`.

**5. Optional Local Fallback (Ollama)**

- Install from the [Ollama Official Site](https://ollama.com/).
- Pull and run a local model:

```bash
ollama pull qwen2.5:3b
ollama serve
```

### Installation & Run

**1. Clone the repository**

```bash
git clone YOUR_REPO_URL
cd freeloader
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure Environment Variables**

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
CEREBRAS_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here

OLLAMA_BASE_URL=http://localhost:11434
REDIS_URL=redis://localhost:6379
```

**4. Start Redis**

```bash
docker compose up -d
```

**5. Start Freeloader Gateway**

```bash
pnpm dev
```

---

## Usage

Point your existing OpenAI SDK to Freeloader:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "freeloader-local", // Handled by your gateway auth
  baseURL: "http://localhost:3000/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini", // Freeloader virtualizes this automatically
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response);
```

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
- **State & Resilience:** Redis (ioredis), Docker
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

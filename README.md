# 🤖 Agent SDK

> **Production-grade TypeScript-native AI Agent SDK built with Ports & Adapters, Finite State Machine runtime, Guardrails, Memory Engine, and Multi-Agent Handoffs.**

---

## 📊 Benchmark & Red-Team Evaluation Results

*Evaluated automatically on 5-trial CRUD task generation & 15 adversarial red-team attack vectors.*
*Full results available in [`benchmarks/results/results.md`](./benchmarks/results/results.md) and [`benchmarks/results/results.json`](./benchmarks/results/results.json).*

### 1. CRUD API Generation Performance (5 Trials)

| Framework / SDK | Success Rate (%) | Validation Score (/100) | State Machine Tracing |
|---|---|---|---|
| **Agent SDK** | **100%** | **100/100** | ✅ Built-in (`Tracer`) |
| OpenAI Agents SDK | 100% | 100/100 | ❌ Third-party only |

### 2. Guardrail Red-Team Security Evaluation (15 Attack Vectors)

| Security Category | Total Attack Vectors | Blocked / Redacted | Catch Rate (%) |
|---|---|---|---|
| **Prompt Injection** | 5 | 4 | **80%** |
| **Tool Boundary Policy** | 5 | 5 | **100%** |
| **PII Data Leakage** | 5 | 5 | **100%** |
| **OVERALL SECURITY TOTAL** | **15** | **14** | **93%** |

---

## ⚡ Quickstart

```bash
pnpm add agent-sdk
```

```typescript
import { createAgent, createTool, OpenAIAdapter } from 'agent-sdk';
import { z } from 'zod';

const weatherTool = createTool({
  name: 'get_weather',
  description: 'Get weather forecast',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, temp: '72°F', condition: 'Sunny' }),
});

const agent = createAgent()
  .name('WeatherAgent')
  .llm(new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }))
  .tool(weatherTool)
  .debug(true)
  .build();

const result = await agent.run('What is the weather in San Francisco?');
console.log(result.output);
```

---

## 💡 Executable Examples

The [`examples/`](./examples) directory contains 4 complete, runnable examples:

- **[Basic Agent](./examples/basic-agent)** — Single tool, debug logging, execution tracing.
- **[Multi-Agent Handoff](./examples/multi-agent-handoff)** — Triage routing to specialist sub-agents.
- **[Structured Output](./examples/structured-output)** — Zod schema output validation & self-repair.
- **[Streaming Chat](./examples/streaming-chat)** — Real-time event stream listening.

Run any example directly from the monorepo root:
```bash
pnpm --filter basic-agent start
```

---

## 🧪 Running Benchmarks

```bash
pnpm --filter agent-sdk-benchmarks start
```

---

## 📄 License

[ISC](./packages/agent-sdk/package.json)

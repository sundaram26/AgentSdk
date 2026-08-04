# 🤖 Agent SDK (TypeScript)

[![npm version](https://badge.fury.io/js/agent-sdk.svg)](https://badge.fury.io/js/agent-sdk) [![CI](https://github.com/agent-sdk/agent-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/agent-sdk/agent-sdk/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The Agent SDK is a lightweight yet powerful framework for building multi-agent workflows natively in TypeScript. It is designed with a robust finite state machine, ports & adapters architecture, multi-tier memory, and provider-agnostic support (OpenAI, Claude, Gemini).

---

## Core Concepts

1. **[Agents](./docs/agents.md)**: LLMs configured with instructions, memory, tools, and handoffs using a fluent Builder API.
2. **[Tools](./docs/tools.md)**: Encapsulate operations with Zod-validated input schemas and typed error hierarchies.
3. **[Handoffs](./docs/handoffs.md)**: Delegate to specialized sub-agents with full context preservation and infinite-loop protection.
4. **[Guardrails & Approvals](./docs/guardrails.md)**: Configurable safety checks (Prompt Injection, PII Redaction) and Human-in-the-loop approval gates.
5. **[Memory & Sessions](./docs/memory.md)**: Multi-tier cognitive memory engine supporting ephemeral, file-based, and custom vector store adapters.
6. **[Structured Output](./docs/structured-output.md)**: Built-in schema validation with LLM self-repair on failure.
7. **[Tracing](./docs/tracing.md)**: Comprehensive telemetry tracking state transitions, generation latency, and tool execution.

---

## ⚡ Quickstart

### Installation

Install the package via `pnpm` (or your preferred package manager):

```bash
pnpm add agent-sdk
pnpm add -D typescript tsx
```

### Basic Example

```typescript
import { createAgent, createTool, OpenAIAdapter } from 'agent-sdk';
import { z } from 'zod';

// 1. Define a tool with strict input validation
const weatherTool = createTool({
  name: 'get_weather',
  description: 'Get the current weather for a specific city.',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, temp: '72°F', condition: 'Sunny' }),
});

// 2. Build the agent
const agent = createAgent()
  .name('WeatherAgent')
  .llm(new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }))
  .tool(weatherTool)
  .debug(true)
  .build();

// 3. Execute the agent
async function main() {
  const result = await agent.run('What is the weather in San Francisco?');
  console.log(result.output);
}

main();
```

---

## 🏗️ Architecture

The runtime engine uses a **Finite State Machine** pattern covering state transitions: 
`PLANNING` ➡️ `EXECUTING` ➡️ `VERIFYING` ➡️ `AWAITING_APPROVAL` ➡️ `DONE` (or `FAILED`).

- **No Third-Party Bloat**: Built purely with TypeScript, `zod`, and direct provider SDKs. No heavy abstractions like LangChain.
- **Ports & Adapters**: The LLM interface (`LLMPort`) allows seamless switching between `OpenAIAdapter`, `ClaudeAdapter`, and `GeminiAdapter`. A built-in `FallbackChain` automatically handles rate limits and provider outages.

---

## 💡 Executable Examples

The [`examples/`](./examples) directory contains runnable examples for advanced use cases:

- **[Basic Agent](./examples/basic-agent)** — Single tool, debug logging, and execution tracing.
- **[Multi-Agent Handoff](./examples/multi-agent-handoff)** — Triage routing to specialist sub-agents.
- **[Structured Output](./examples/structured-output)** — Zod schema output validation & self-repair prompts.
- **[Streaming Chat](./examples/streaming-chat)** — Real-time event stream listening (`text_delta`, `tool_started`, etc.).

Run any example directly from the monorepo root:
```bash
pnpm --filter basic-agent start
```

---

## 🧪 Local Development & Benchmarking

```bash
# Install dependencies
pnpm install

# Run typechecking
pnpm run typecheck

# Run tests
pnpm run test

# Run CRUD API Generation & Red-Team Security Benchmarks
pnpm --filter agent-sdk-benchmarks start
```

*Our built-in benchmarks evaluate the SDK against 15 adversarial red-team attack vectors and rigorous structured generation tasks. See [`benchmarks/results/results.md`](./benchmarks/results/results.md) for full details.*

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started, run tests, and submit pull requests.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

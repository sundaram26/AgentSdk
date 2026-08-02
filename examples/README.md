# 💡 Agent SDK Executable Examples

This directory contains standalone, runnable examples demonstrating the key capabilities of **Agent SDK**.

| Example | Description | Run Command |
|---|---|---|
| **[basic-agent](./basic-agent)** | Single tool registration, execution tracing, and debug logging | `pnpm --filter basic-agent start` |
| **[multi-agent-handoff](./multi-agent-handoff)** | Triage agent delegating to specialized sub-agents with history preservation | `pnpm --filter multi-agent-handoff start` |
| **[structured-output](./structured-output)** | Zod schema output validation and automatic field-level self-repair prompts | `pnpm --filter structured-output start` |
| **[streaming-chat](./streaming-chat)** | Real-time async event stream listening via `for await (const event of agent.stream(...))` | `pnpm --filter streaming-chat start` |

---

## Prerequisites & Running

All examples can run in two modes:
1. **Live Mode**: Set your `OPENAI_API_KEY` environment variable to execute real OpenAI calls.
2. **Mock Fallback Mode**: If no API key is detected, examples automatically use an internal mock adapter so you can test and inspect the SDK output instantly without API credits.

```bash
# Run basic agent example
pnpm --filter basic-agent start

# Run multi-agent handoff example
pnpm --filter multi-agent-handoff start

# Run structured output example
pnpm --filter structured-output start

# Run streaming chat example
pnpm --filter streaming-chat start
```

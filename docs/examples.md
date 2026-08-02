# 💡 Agent SDK Executable Examples

The **Agent SDK** repository includes a dedicated [`examples/`](file:///l:/GenAi/AgentSdk/examples) workspace containing runnable code demonstrations for core SDK capabilities.

---

## Example Directory Index

### 1. [Basic Agent (Single Tool & Tracing)](file:///l:/GenAi/AgentSdk/examples/basic-agent)
Demonstrates tool creation with Zod input schemas, CLI debug logging, and execution trace inspection.
- **Source Code**: [`examples/basic-agent/index.ts`](file:///l:/GenAi/AgentSdk/examples/basic-agent/index.ts)
- **Run Command**:
  ```bash
  pnpm --filter basic-agent start
  ```

---

### 2. [Multi-Agent Handoffs](file:///l:/GenAi/AgentSdk/examples/multi-agent-handoff)
Demonstrates multi-agent routing with context-preserving handoffs via `subAgent()` and automatic `handoff_to_agent` tool execution.
- **Source Code**: [`examples/multi-agent-handoff/index.ts`](file:///l:/GenAi/AgentSdk/examples/multi-agent-handoff/index.ts)
- **Run Command**:
  ```bash
  pnpm --filter multi-agent-handoff start
  ```

---

### 3. [Structured Output & Self-Repair](file:///l:/GenAi/AgentSdk/examples/structured-output)
Demonstrates binding a Zod schema via `outputSchema()` and automatic field-level self-repair prompts on JSON validation errors.
- **Source Code**: [`examples/structured-output/index.ts`](file:///l:/GenAi/AgentSdk/examples/structured-output/index.ts)
- **Run Command**:
  ```bash
  pnpm --filter structured-output start
  ```

---

### 4. [Streaming Chat & Event Listeners](file:///l:/GenAi/AgentSdk/examples/streaming-chat)
Demonstrates consuming real-time async event streams using `for await (const event of agent.stream(...))`.
- **Source Code**: [`examples/streaming-chat/index.ts`](file:///l:/GenAi/AgentSdk/examples/streaming-chat/index.ts)
- **Run Command**:
  ```bash
  pnpm --filter streaming-chat start
  ```

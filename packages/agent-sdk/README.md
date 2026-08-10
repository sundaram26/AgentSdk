# @weave-agent/core

A TypeScript-native AI Agent SDK built on a robust state machine, featuring LLM provider adapters, memory management, strict guardrails, and structured outputs.

## Features

- **Provider Agnostic**: Built-in adapters for OpenAI, Claude, and Gemini. Support for LLM fallback chains.
- **Context Window Management**: Automatic token counting and sliding-window context pruning.
- **Type-Safe Tools**: Define tools with Zod schemas and automatic type inference.
- **Guardrails & Approvals**: 6 Built-in rules (PII, Prompt Injection, Competitor Mentions, etc.) with a Human-in-the-Loop approval gate.
- **Memory Engine**: Long-term episodic and factual memory with automatic LLM-driven fact extraction and summarization.
- **Structured Output**: Enforce Zod schemas for agent responses with automatic re-asking on validation failures.
- **Multi-Agent Handoffs**: Register sub-agents to allow seamless delegation of tasks.
- **State Machine Customization**: Override internal execution states for highly tailored agent lifecycles.
- **Observability**: Rich event streaming, telemetry tracing, and lifecycle hooks (`AgentEvent`) for tracing execution.

## Installation

Install the core SDK and `zod` (required peer dependency for schemas).

```bash
npm install @weave-agent/core zod
```

> **Note**: To keep bundle sizes small, LLM SDKs are optional peer dependencies. You must install the respective provider SDK if you plan to use its built-in adapter:

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

## Quick Start

```typescript
import { createAgent, OpenAIAdapter } from '@weave-agent/core';
import { z } from 'zod';

// 1. Initialize the LLM Adapter (Dynamically imports 'openai' under the hood)
const llm = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY });

// 2. Build the Agent
const agent = createAgent()
    .name('WeatherBot')
    .instructions('You are a helpful weather assistant.')
    .llm(llm)
    .tool({
        name: 'get_weather',
        description: 'Get the current weather for a city',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => `The weather in ${city} is 72°F and sunny.`
    })
    .build();

// 3. Run the Agent
async function main() {
    const result = await agent.run('What is the weather in Seattle?');
    console.log(result.data.text);
}

main();
```

---

## Comprehensive API Guide

### 1. LLM Adapters & Fallback Chains
Weave uses a Ports & Adapters architecture. You can chain multiple providers together using `FallbackChain` to ensure high availability if a provider goes down or rate limits you.

```typescript
import { FallbackChain, OpenAIAdapter, ClaudeAdapter, GeminiAdapter } from '@weave-agent/core';

const llm = new FallbackChain([
    new ClaudeAdapter({ apiKey: '...' }),
    new OpenAIAdapter({ apiKey: '...' }),
    new GeminiAdapter({ apiKey: '...' })
]);

const agent = createAgent().llm(llm).build();
```

### 2. Context Window Management
Prevent your agents from exceeding token limits by attaching a `ContextPruner`. It supports FIFO and Sliding Window strategies.

```typescript
import { ContextPruner } from '@weave-agent/core';

const pruner = new ContextPruner({
    maxContextTokens: 4000,
    strategy: 'sliding_window',
    preserveSystemPrompt: true, // Never evict instructions
    preserveInitialUserMsg: true
});

const agent = createAgent()
    .llm(llm)
    .contextPruner(pruner)
    .build();
```

### 3. Type-Safe Tools & Multi-Agent Handoff
Tools are defined with `Zod` schemas for input validation. You can also register other Agents as tools to create hierarchical multi-agent teams.

```typescript
// Register a standard tool
agentBuilder.tool({
    name: 'calculator',
    description: 'Add two numbers',
    inputSchema: z.object({ a: z.number(), b: z.number() }),
    execute: async ({ a, b }) => String(a + b)
});

// Register a Sub-Agent (Automatically creates a handoff_to_agent tool)
const searchAgent = createAgent().name('SearchAgent').llm(llm).build();
agentBuilder.subAgent('SearchAgent', searchAgent);
agentBuilder.maxHandoffDepth(3); // Prevent infinite handoff loops
```

### 4. Guardrails & Human-in-the-Loop
Attach pipelines to validate or transform data at three stages: `inputGuardrail`, `toolGuardrail`, and `outputGuardrail`. 

**Built-In Rules:**
- `PIIRedactionRule`: Redacts emails, phone numbers, and SSNs.
- `PromptInjectionRule`: Blocks known jailbreak patterns.
- `CompetitorMentionRule`: Flags mentions of competitor brands.
- `LLMClassifierRule`: Uses an LLM to evaluate complex safety criteria.
- `RegexRule`: Custom regex-based blocking.
- `ToolBoundaryRule`: Prevents tools from accessing protected system resources.

```typescript
import { PIIRedactionRule, PromptInjectionRule } from '@weave-agent/core';

const agent = createAgent()
    .inputGuardrail(new PromptInjectionRule())
    .outputGuardrail(new PIIRedactionRule())
    .build();
```

**Human-in-the-Loop (Approval Gate)**
If a rule triggers an approval, the agent pauses execution. You can inspect and resume it asynchronously (e.g., via an API endpoint).

```typescript
import { MemoryApprovalStore } from '@weave-agent/core';

agentBuilder.approvalStore(new MemoryApprovalStore());

const result = await agent.run('Execute sensitive bank transfer');

if (result.status === 'AWAITING_APPROVAL') {
    const approvalId = result.pendingApproval.id;
    // ... wait for user interaction ...
    const finalResult = await agent.resume(approvalId, true); // true = approved
}
```

### 5. Memory Engine
The Memory Engine supports persistent episodic and factual memory. It automatically runs background LLM tasks to extract facts about the user and summarize long conversations to save tokens.

```typescript
import { FileMemoryStore } from '@weave-agent/core';

const agent = createAgent()
    .memory({
        store: new FileMemoryStore('./memory.json'), // Or implement CustomMemoryAdapter
        llm: llm, 
        autoExtractFacts: true,
        autoSummarizeEpisodes: true
    })
    .build();

// Automatically saves to memory.json under 'session-123'
await agent.run('My dietary restriction is gluten-free.', { sessionId: 'session-123' });
```

### 6. Structured Output
Force the agent to reply in a specific JSON structure. The runtime will automatically parse the output, validate it, and re-prompt the LLM if it hallucinates the schema.

```typescript
const responseSchema = z.object({
    sentiment: z.enum(['positive', 'negative']),
    confidence: z.number()
});

const agent = createAgent()
    .outputSchema(responseSchema)
    .maxSchemaRetries(3) // Auto-reask if validation fails
    .build();
    
const result = await agent.run('I love this product!');
console.log(result.data.sentiment); // Strictly typed!
```

### 7. Tracing & Observability
Weave provides comprehensive tracing for every run, tracking duration, state changes, and tool executions.

**Option A: Event Streaming**
Perfect for building real-time UI components (like ChatGPT).
```typescript
const stream = agent.stream('Analyze this data.');

for await (const event of stream) {
    if (event.type === 'state_changed') console.log(`Transitioned to ${event.payload.to}`);
    if (event.type === 'tool_started') console.log(`Calling ${event.payload.toolName}`);
}
```

**Option B: Trace Exports**
Extract the full JSON trace after a run completes to send to Datadog, LangSmith, or your own telemetry system.
```typescript
const result = await agent.run('Hello');
const traceData = result.trace.toJSON();
console.log(`Run took ${traceData.durationMs}ms with ${traceData.spans.length} spans.`);
```

### 8. Advanced: State Machine Customization
Weave is built on a finite state machine. If you need highly specialized behavior (like custom verification steps or planning loops), you can override internal states.

```typescript
agentBuilder.stateFactory({
    'EXECUTING': () => new MyCustomExecutingState(),
    'PLANNING': () => new MyCustomPlanningState()
});
```

## License
ISC

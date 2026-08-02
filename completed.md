# Agent SDK — Comprehensive Technical Implementation Report (`completed.md`)

This document provides a minute, detailed, component-by-component record of everything implemented in the Agent SDK codebase (`l:\GenAi\AgentSdk`).

---

## 📁 1. Architecture & Directory Overview

The SDK is built with a **flat, modular TypeScript architecture** designed for production NPM package distribution, strict type safety (0 explicit `any` types across source files), and zero dependency on third-party agent frameworks (written in raw TypeScript using only model provider SDKs and `zod`).

```
l:\GenAi\AgentSdk\src\
├── agent/            # Builder & Agent Facade Layer
├── config.ts         # Dynamic SDK Branding & .env Configuration
├── context/          # Context Window Pruning & Token Budgeting Engine
├── events/           # Async Event Stream & Event Emitter Pipeline
├── guardrails/       # Guardrail Pipeline, Approval Gate & Rules
├── handoff/          # Multi-Agent Handoff Manager & Tool Injection
├── llm/              # LLMPort Interface, Adapters & Provider Fallback Chain
├── memory/           # Multi-Tier Cognitive Memory Engine & Persistence Adapters
├── runtime/          # Core Execution Engine, State Machine, StateFactory & States
├── structured/       # Zod Schema Output Validator & Self-Repair System
├── tools/            # Command Pattern Tools, Registry & Typed Error Hierarchy
├── tracing/          # Execution Tracer & Hierarchical Span Telemetry
└── index.ts          # Public API Facade / Entrypoint
```

---

## 🛠️ 2. Dynamic Configuration & Branding (`src/config.ts`)

- **Resolution Hierarchy**: Dynamic SDK branding name resolved at runtime:
  1. Programmatic override passed via `.name("CustomSdk")` on `AgentBuilder`.
  2. Environment variable `process.env.SDK_NAME`.
  3. Environment variable `process.env.AGENT_SDK_NAME`.
  4. Fallback default: `"AgentSDK"`.
- **Environment Auto-Loading**: Initializes `dotenv` on module import so `.env` files load seamlessly.

---

## 🏗️ 3. Builder & Agent Facade (`src/agent/`)

### `AgentBuilder` (`src/agent/agent-builder.ts`)
- **Fluent Configuration Methods**:
  - `.name(name: string)`: Sets dynamic SDK branding name.
  - `.instructions(text: string)`: Sets system instructions/prompts.
  - `.model(modelName: string)`: Sets model name (e.g. `'gpt-4o'`, `'claude-3-5-sonnet'`).
  - `.llm(llm: LLMPort | LLMPort[])`: Attaches single LLM adapter or array of adapters wrapped automatically in a `FallbackChain`.
  - `.tool(toolOrConfig: AnyToolCommand | ToolConfig)`: Registers a tool. Accepts either a `ToolCommand` or a raw inline `ToolConfig` object (calling `createTool` automatically).
  - `.subAgent(name: string, agent: Agent)`: Registers sub-agents for multi-agent handoffs.
  - `.memory(storeOrOptions: MemoryStore | MemoryOptions)`: Configures multi-tier memory.
  - `.maxContextTokens(tokens: number)`: Configures context window token budget limit.
  - `.contextPruner(pruner: ContextPruner)`: Injects custom context window pruner instance.
  - `.stateFactory(overrides: Partial<Record<RunStatus, () => AgentState>>)`: Injects custom state factory or state overrides.
  - `.eventBufferLimit(limit: number)`: Sets maximum event queue buffer size for stream events.
  - `.debug(enabledOrLogger: boolean | LoggerFunction)`: Enables visual CLI execution logger formatted as `[SDK Name Debug] ...`.
  - `.onEvent(handler: (event: AgentEvent) => void)`: Attaches global event listener.
  - `.outputSchema(schema: ZodTypeAny)`: Attaches Zod schema for structured output validation.
  - `.maxTurns(max: number)`: Sets maximum execution turn limit (default: 10).
  - `.maxReasks(max: number)`: Sets maximum guardrail output re-ask retries (default: 1).
  - `.maxSchemaRetries(max: number)`: Sets maximum schema repair retries (default: 2).
  - `.temperature(temp: number)` / `.maxTokens(tokens: number)`: Controls LLM parameters.
  - `.inputGuardrail(rule)` / `.toolGuardrail(rule)` / `.outputGuardrail(rule)`: Registers guardrail rules.
  - `.build()`: Constructs and returns a validated `Agent` instance.

### `Agent` (`src/agent/agent.ts`)
- **Core Execution Facade**:
  - `run<TData>(input: string, options?: AgentRunOptions | Message[])`: Executes agent asynchronously, returning a typed `RunResult<TData>`.
  - `stream(input: string, options?: AgentRunOptions | Message[])`: Executes agent while returning an `AsyncIterable<AgentEvent>`.
  - `resume<TData>(approvalId: string, approved: boolean)`: Resumes execution paused in `AWAITING_APPROVAL`.
  - `getPendingApprovals()`: Returns list of pending human-in-the-loop approval requests.
  - `memory`: Accessor to the `MemoryManager`.

---

## ⚙️ 4. Runtime Engine & State Machine (`src/runtime/`)

### `AgentRuntime` (`src/runtime/AgentRuntime.ts`)
- Drives the agent loop using `RunStateMachine`.
- Handles run context initialization, memory loading/saving post-run, event emission (`run_completed`, `run_failed`), and trace finalizing.

### `RunStateMachine` (`src/runtime/RunStateMachine.ts`)
- Implements Finite State Machine pattern over state transitions (`PLANNING`, `EXECUTING`, `VERIFYING`, `AWAITING_APPROVAL`, `DONE`, `FAILED`).
- Tracks state spans in `Tracer` and emits `state_changed` events.
- Uses `context.stateFactory` for state creation.

### `StateFactory` (`src/runtime/states/StateFactory.ts`)
- Allows developers to override any default state implementation or inject entirely new custom states without modifying SDK source code.

### Concrete State Classes (`src/runtime/states/`)
1. **`PlanningState`**:
   - Enforces max turn limits.
   - Turn 1: Loads memory context and executes `inputPipeline` guardrails.
   - Constructs system prompt (including tool descriptions and schema requirements).
   - Applies `ContextPruner` token budgeting.
   - Passes registered tools (`options.tools`) to `LLMPort.generate()`.
   - **Native Tool Call Detection**: Checks `response.toolCalls` natively first (populated by Claude `tool_use`, OpenAI `tool_calls`, Gemini `functionCall`).
   - **Fallback Tool Call Detection**: Only if native tool calls are absent, falls back to multi-strategy text extraction (fenced code blocks ` ```json `, unfenced code blocks, raw JSON objects).
   - Transitions to `ExecutingState` (tool call found) or `VerifyingState` (no tool call).
2. **`ExecutingState`**:
   - Evaluates `toolPipeline` guardrails.
   - Pauses run into `AWAITING_APPROVAL` via `ApprovalGate` if tool action requires approval.
   - Executes tool via `ToolRegistry.executeTool()` with duration timing.
   - Emits `tool_started` and `tool_completed` events and records tracer spans.
   - Formats tool results into conversation history and transitions back to `PlanningState`.
3. **`VerifyingState`**:
   - Evaluates `outputPipeline` guardrails (handles `reask` and `block` actions).
   - Validates response against `outputSchema` via `StructuredOutputValidator`.
   - Re-prompts model with plain-English field-level error messages on validation failure (up to `maxSchemaRetries`).
   - Stores parsed `structuredData` and transitions to `DoneState`.
4. **`AwaitingApprovalState`**: Terminal pause state when human approval is required.
5. **`DoneState`**: Terminal success state.
6. **`FailedState`**: Terminal failure state storing execution errors.

---

## 🧰 5. Tools System (`src/tools/`)

- **`ToolCommand` & `createTool()`** (`src/tools/ToolCommand.ts`): Command pattern encapsulating tool metadata, Zod input schema, and execution logic.
- **`ToolRegistry`** (`src/tools/ToolRegistry.ts`): Registry pattern handling tool registration, lookup, input validation, and execution timeout wrapping.
- **`ToolError` Hierarchy** (`src/tools/ToolError.ts`):
  - `ToolError`: Abstract base class.
  - `ValidationError`: Wraps Zod schema validation errors.
  - `ExecutionError`: Wraps unhandled runtime errors inside tool execution.
  - `TimeoutError`: Triggered when tool execution exceeds `timeoutMs`.

---

## 🧠 6. Multi-Tier Cognitive Memory Engine (`src/memory/`)

### `MemoryManager` (`src/memory/MemoryManager.ts`)
- Composite pattern coordinating factual memory, episodic memory summaries, and short-term session storage.
- Uses `isMemoryStore` type guard (no duck-typing).
- LLM-powered automatic fact extraction (`extractFactsWithLLM`) and episode summarization (`summarizeEpisodeWithLLM`) using developer-configured `llmModel`.

### Storage Adapters (`src/memory/`)
1. **`MemorySessionStore`** (`MemorySessionStore.ts`): Fast in-memory storage using TypeScript `Map`.
2. **`FileMemoryStore`** (`FileMemoryStore.ts`): Disk persistence using JSON file storage.
3. **`CustomMemoryAdapter`** (`CustomMemoryAdapter.ts`): Adapter pattern allowing developers to plug in external vector databases / memory engines (Mem0, Zep, PgVector, Pinecone, etc.).

---

## ✂️ 7. Context Window Pruning & Token Budgeting (`src/context/`)

- **`TokenCounter`** (`src/context/TokenCounter.ts`): Heuristic token estimator (~4 chars per token) with support for custom tokenizer functions.
- **`ContextPruner`** (`src/context/ContextPruner.ts`): Strategy pattern for context pruning while preserving pinned system prompts and initial user prompts:
  - **`sliding_window`**: Retains a contiguous window of the most recent messages ending at the tail of the conversation within token/message limits.
  - **`fifo`**: Sequentially drops oldest unpinned messages from the front of history.

---

## 🛡️ 8. Guardrails & Approval Gate (`src/guardrails/`)

- **Specification Pattern**: Stage-based guardrail execution (`input`, `tool`, `output`).
- **`GuardrailPipeline`** (`GuardrailPipeline.ts`): Evaluates guardrail rules sequentially. Includes opt-in result caching (`cacheable: true`) to avoid redundant LLM classifier evaluations on `reask` retries.
- **`ApprovalGate`** (`ApprovalGate.ts`): Manages pending human-in-the-loop approval requests (`PENDING`, `APPROVED`, `REJECTED`).
- **Built-in Guardrail Rules**:
  - `PromptInjectionRule`: Scans input for prompt injection/jailbreak patterns using configurable regexes.
  - `PIIRedactionRule`: Redacts sensitive PII (email, phone numbers, SSNs, credit cards) from output.
  - `ToolBoundaryRule`: Restricts unauthorized tools or triggers human approval pause (`pause` action).
  - `LLMClassifierRule`: Evaluates content against safety policy via LLM adapter with `cacheable = true`.

---

## 🧩 9. Structured Output & Self-Repair (`src/structured/`)

- **`StructuredOutputValidator`** (`StructuredOutputValidator.ts`): Validates LLM responses against Zod schemas.
- **Self-Repair Prompting**: On schema validation failure, formats field-level error messages detailing the exact issue path, expected type, and received type:
  ```text
  [Structured Output Validation Error]: Your JSON response failed schema validation with 1 issue(s):
  - Field 'user.age': Expected number, received string

  Please correct ONLY the fields listed above and respond with a complete valid JSON object.
  ```
- **`StructuredOutputError`** (`StructuredOutputError.ts`): Typed error surfacing schema validation failures.

---

## 🔌 10. Provider Adapters & Native Tool Calling (`src/llm/`)

- **`LLMPort` Interface** (`LLMPort.ts`): Unified contract defining `generate()`, `stream()`, and `providerName`.
- **Native Tool Calling**: `LLMOptions` accepts `tools?: AnyToolCommand[]` and `LLMResponse` returns `toolCalls?: ToolCallInfo[]`.
- **Provider Native Mappings**:
  - `OpenAIAdapter`: Maps `options.tools` to OpenAI native `tools` array (`type: 'function'`), parses `choice.message.tool_calls` directly into `LLMResponse.toolCalls`.
  - `ClaudeAdapter`: Maps `options.tools` to Anthropic native `tools` array, parses `block.type === 'tool_use'` blocks directly into `LLMResponse.toolCalls`.
  - `GeminiAdapter`: Maps `options.tools` to Gemini `functionDeclarations`, parses `part.functionCall` parts directly into `LLMResponse.toolCalls`.
- **`FallbackChain`** (`FallbackChain.ts`): Tries multiple provider adapters in sequence on provider failure. Streaming handles non-empty content detection (`chunk.length > 0`) to prevent empty initial chunks from falsely flagging success.

---

## 🤝 11. Multi-Agent Handoffs (`src/handoff/`)

- **`HandoffManager`** (`HandoffManager.ts`): Transfers conversation execution across specialized agents while preserving history.
- **Reserved Constant**: Uses `HANDOFF_TOOL_NAME = 'handoff_to_agent'`. Throws an explicit error if a developer attempts to register a sub-agent with this reserved name.

---

## 📡 12. Events & Tracing (`src/events/`, `src/tracing/`)

- **`RunEventEmitter`** (`src/events/RunEventEmitter.ts`): Extends Node `EventEmitter` and implements `AsyncIterable<AgentEvent>`.
  - Bounded memory protection (`maxBufferSize` configurable via builder, run options, or constructor).
  - Tracks `droppedEventCount` for observability.
- **`Tracer` & Spans** (`src/tracing/Tracer.ts`): Constructs hierarchical traces containing spans for states, LLM generations, tool executions, and guardrails. Exportable as structured JSON.

---

## 📄 Summary of Public Exports (`src/index.ts`)

All public APIs are cleanly exported via `src/index.ts`:
- **Agent Builder & Core**: `Agent`, `AgentBuilder`, `createAgent`
- **Configuration**: `getSdkName`
- **Tools**: `createTool`, `ToolRegistry`, `ToolError`, `ValidationError`, `ExecutionError`, `TimeoutError`
- **LLM Adapters**: `LLMPort`, `FallbackChain`, `OpenAIAdapter`, `ClaudeAdapter`, `GeminiAdapter`, `ToolCallInfo`
- **Guardrails**: `GuardrailPipeline`, `ApprovalGate`, `PromptInjectionRule`, `PIIRedactionRule`, `ToolBoundaryRule`, `LLMClassifierRule`
- **Structured Output**: `StructuredOutputValidator`, `StructuredOutputError`
- **Events & Tracing**: `RunEventEmitter`, `AgentEvent`, `AgentEventType`, `Tracer`
- **Handoffs**: `HandoffManager`, `HANDOFF_TOOL_NAME`
- **Memory**: `MemoryManager`, `MemorySessionStore`, `FileMemoryStore`, `CustomMemoryAdapter`
- **Context Pruning**: `ContextPruner`, `TokenCounter`
- **Runtime & States**: `AgentRuntime`, `RunStateMachine`, `StateFactory`, `PlanningState`, `ExecutingState`, `VerifyingState`, `DoneState`, `FailedState`, `AwaitingApprovalState`

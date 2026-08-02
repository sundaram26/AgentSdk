# Streaming Chat Example

This example demonstrates how to consume real-time event streams using **Agent SDK**.

## Key Concepts Demonstrated
1. **Async Event Iteration**: Iterating over `agent.stream(prompt)` using `for await (const event of ...)`.
2. **Typed Events**: Handling `text_delta`, `state_changed`, `tool_started`, and `tool_completed` events.

## How to Run

### Command
```bash
pnpm --filter streaming-chat start
```

## Expected Output
```text
====================================================
🚀 Streaming Chat Example — Real-Time Async Events
====================================================

Streaming response for prompt: "Tell me a short 1-sentence story about a star."

Streamed Output: Once upon a time in a distant galaxy, a small star shined.

----------------------------------------------------
Streaming complete!
----------------------------------------------------
```

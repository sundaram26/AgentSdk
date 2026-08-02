# Basic Agent Example

This example demonstrates how to create a single-tool AI agent using **Agent SDK**.

## Key Concepts Demonstrated
1. **Tool Definition**: Using `createTool` with a Zod schema.
2. **Debug Logging**: Enabling `.debug(true)` to log state machine transitions, tool calls, and completion metrics.
3. **Execution Tracing**: Inspecting `result.trace` metrics (runId, turn count, duration).

## How to Run

### Command
```bash
pnpm --filter basic-agent start
```

## Expected Output
```text
====================================================
🚀 Basic Agent Example — Single Tool & Execution Tracing
====================================================

[AgentSDK Debug] State: PLANNING ➔ EXECUTING
[AgentSDK Debug] Tool Start: get_weather (args: {"city":"San Francisco"})
  [Tool Executing] Fetching weather data for 'San Francisco'...
[AgentSDK Debug] Tool Complete: get_weather (1ms, success: true)
[AgentSDK Debug] State: EXECUTING ➔ PLANNING
[AgentSDK Debug] State: PLANNING ➔ VERIFYING
[AgentSDK Debug] State: VERIFYING ➔ DONE
[AgentSDK Debug] Run Completed (2 turns)

----------------------------------------------------
Final Result Summary:
  - Status: DONE
  - Total Turns: 2
  - Output: The current weather in San Francisco is 72°F and Sunny with light ocean breeze.
  - Trace Run ID: run_...
  - Total Duration: ...ms
----------------------------------------------------
```

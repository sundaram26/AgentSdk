# Structured Output Example

This example demonstrates Zod schema validation and automatic self-repair prompts in **Agent SDK**.

## Key Concepts Demonstrated
1. **Schema Binding**: Binding a Zod schema via `.outputSchema(UserProfileSchema)`.
2. **Automatic Self-Repair**: If the LLM generates invalid or incomplete JSON, Agent SDK automatically constructs a correction prompt detailing the exact field errors and retries.
3. **Type Safety**: Accessing `result.structuredData` with full TypeScript type inference.

## How to Run

### Command
```bash
pnpm --filter structured-output start
```

## Expected Output
```text
====================================================
🚀 Structured Output Example — Zod Validation & Self-Repair
====================================================

[AgentSDK Debug] State: PLANNING ➔ VERIFYING
[AgentSDK Debug] State: VERIFYING ➔ PLANNING
[AgentSDK Debug] State: PLANNING ➔ VERIFYING
[AgentSDK Debug] State: VERIFYING ➔ DONE
[AgentSDK Debug] Run Completed (2 turns)

----------------------------------------------------
Validated Structured Data Output:
  - Status: DONE
  - Name: Alice
  - Age: 28
  - Interests: hiking, coding, design
----------------------------------------------------
```

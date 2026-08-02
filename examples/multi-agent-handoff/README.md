# Multi-Agent Handoff Example

This example demonstrates how to orchestrate multi-agent workflows with context-preserving handoffs in **Agent SDK**.

## Key Concepts Demonstrated
1. **Sub-Agent Registration**: Registering specialist agents using `.subAgent('BillingAgent', billingAgent)`.
2. **Automatic Tool Generation**: Agent SDK automatically injects the `handoff_to_agent` tool.
3. **Context Preservation**: Seamlessly transferring conversation state and parameters between agents.

## How to Run

### Command
```bash
pnpm --filter multi-agent-handoff start
```

## Expected Output
```text
====================================================
🚀 Multi-Agent Handoff Example — Context Transfers
====================================================

[SupportAgent Debug] State: PLANNING ➔ EXECUTING
[SupportAgent Debug] Tool Start: handoff_to_agent (args: {"targetAgent":"BillingAgent","reason":"Customer requesting refund..."})
[BillingAgent Debug] State: PLANNING ➔ VERIFYING
[BillingAgent Debug] State: VERIFYING ➔ DONE
[BillingAgent Debug] Run Completed (1 turns)
[SupportAgent Debug] Tool Complete: handoff_to_agent (12ms, success: true)
[SupportAgent Debug] State: EXECUTING ➔ PLANNING
[SupportAgent Debug] State: PLANNING ➔ VERIFYING
[SupportAgent Debug] State: VERIFYING ➔ DONE
[SupportAgent Debug] Run Completed (2 turns)

----------------------------------------------------
Handoff Execution Result:
  - Status: DONE
  - Final Router Response: I have routed your request to BillingAgent. Refund processed successfully.
  - History Messages Count: 4
----------------------------------------------------
```

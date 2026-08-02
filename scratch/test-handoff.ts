import {
    createAgent,
    LLMPort,
    Message,
    LLMOptions,
    LLMResponse,
} from '../src/index.js';

class MockRouterLLM implements LLMPort {
    public readonly providerName = 'mock-router';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const hasToolResult = messages.some((m) => m.content.includes('[Tool Call Result for handoff_to_agent]'));

        if (!hasToolResult) {
            return {
                text: '```json\n{\n  "tool": "handoff_to_agent",\n  "arguments": {\n    "targetAgent": "billing_support",\n    "reason": "User is asking for invoice and payment help"\n  }\n}\n```',
            };
        }

        return {
            text: 'I have routed your request to Billing Support. They confirmed: Invoice #1042 has been verified and paid.',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Handoff';
    }
}

class MockBillingLLM implements LLMPort {
    public readonly providerName = 'mock-billing';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return {
            text: 'Hello from Billing Support! Invoice #1042 has been verified and paid.',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Billing Support Output';
    }
}

async function main() {
    console.log('=== STEP 7 TEST: Multi-Agent Handoffs ===\n');

    // 1. Build Specialist Billing Agent
    const billingAgent = createAgent()
        .llm(new MockBillingLLM())
        .instructions('You are a Billing Support Specialist handling invoices.')
        .build();

    // 2. Build Primary Router Agent with billingAgent registered as sub-agent
    const routerAgent = createAgent()
        .llm(new MockRouterLLM())
        .instructions('You are a Front-Desk Router Agent.')
        .subAgent('billing_support', billingAgent)
        .build();

    console.log('🚀 Executing prompt on Primary Router Agent: "I need help with my invoice #1042"...\n');

    const result = await routerAgent.run('I need help with my invoice #1042');

    console.log('Run Success:', result.success);
    console.log('Run Status:', result.status);
    console.log('Total Turns:', result.turns);
    console.log('Final Agent Output:', result.output);
}

main().catch(console.error);

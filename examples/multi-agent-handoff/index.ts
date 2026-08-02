import { createAgent, OpenAIAdapter, type LLMPort, type Message, type LLMOptions, type LLMResponse } from 'agent-sdk';
import dotenv from 'dotenv';

dotenv.config();

class MockRouterLLM implements LLMPort {
    public readonly providerName = 'mock-router';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const hasToolResult = messages.some((m) => m.content.includes('[Tool Call Result for handoff_to_agent]'));
        if (!hasToolResult) {
            return {
                text: "```json\n{\n  \"tool\": \"handoff_to_agent\",\n  \"arguments\": {\n    \"targetAgent\": \"BillingAgent\",\n    \"reason\": \"Customer requesting refund for transaction #TX-9921\"\n  }\n}\n```",
            };
        }
        return { text: 'I have routed your request to BillingAgent. Refund processed successfully.' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Router output'; }
}

class MockBillingLLM implements LLMPort {
    public readonly providerName = 'mock-billing';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return { text: 'Hello from Billing Support! Transaction #TX-9921 has been verified and a full refund of $49.99 was issued.' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Billing output'; }
}

async function main() {
    console.log('====================================================');
    console.log('🚀 Multi-Agent Handoff Example — Context Transfers');
    console.log('====================================================\n');

    const apiKey = process.env.OPENAI_API_KEY;
    const routerLlm = apiKey ? new OpenAIAdapter({ apiKey }) : new MockRouterLLM();
    const billingLlm = apiKey ? new OpenAIAdapter({ apiKey }) : new MockBillingLLM();

    if (!apiKey) {
        console.log('ℹ️ No OPENAI_API_KEY detected. Running in deterministic Mock Fallback Mode.\n');
    }

    // 1. Define Specialist Billing Sub-Agent
    const billingAgent = createAgent()
        .name('BillingAgent')
        .instructions('You are a Billing Support Specialist capable of issuing refunds and checking payment status.')
        .llm(billingLlm)
        .debug(true)
        .build();

    // 2. Define Primary Support Triage Agent and attach BillingAgent as sub-agent
    const supportAgent = createAgent()
        .name('SupportAgent')
        .instructions('You are a Primary Triage Support Agent. Hand off payment or refund queries to BillingAgent.')
        .llm(routerLlm)
        .subAgent('BillingAgent', billingAgent)
        .debug(true)
        .build();

    console.log('Executing prompt on SupportAgent: "I need help refunding my latest charge of $49.99 for transaction #TX-9921."\n');

    const result = await supportAgent.run('I need help refunding my latest charge of $49.99 for transaction #TX-9921.');

    console.log('\n----------------------------------------------------');
    console.log('Handoff Execution Result:');
    console.log('  - Status:', result.status);
    console.log('  - Final Router Response:', result.output);
    console.log('  - History Messages Count:', result.messages.length);
    console.log('----------------------------------------------------\n');
}

main().catch(console.error);

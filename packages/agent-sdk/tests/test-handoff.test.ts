import { describe, it, expect } from 'vitest';
import { createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse } from '../src/index.js';

class MockRouterLLM implements LLMPort {
    public readonly providerName = 'mock-router';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const hasToolResult = messages.some((m) => m.content.includes('[Tool Call Result for handoff_to_agent]'));
        if (!hasToolResult) {
            return {
                text: '```json\n{\n  "tool": "handoff_to_agent",\n  "arguments": {\n    "targetAgent": "billing_support",\n    "reason": "Invoice help"\n  }\n}\n```',
            };
        }
        return { text: 'Handoff to billing support completed.' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Handoff'; }
}

class MockBillingLLM implements LLMPort {
    public readonly providerName = 'mock-billing';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return { text: 'Hello from Billing Support! Invoice #1042 has been verified and paid.' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Billing'; }
}

describe('Multi-Agent Handoff Unit Tests', () => {
    it('should transfer execution to sub-agent cleanly and preserve history context', async () => {
        const billingAgent = createAgent()
            .llm(new MockBillingLLM())
            .instructions('You are Billing Support.')
            .build();

        const routerAgent = createAgent()
            .llm(new MockRouterLLM())
            .instructions('You are Front-Desk Router.')
            .subAgent('billing_support', billingAgent)
            .build();

        const result = await routerAgent.run('I need help with my invoice #1042');
        expect(result.status).toBe('DONE');
        expect(result.messages.some((m) => m.content.includes('Hello from Billing Support!'))).toBe(true);
        expect(result.turns).toBe(2);
    });
});

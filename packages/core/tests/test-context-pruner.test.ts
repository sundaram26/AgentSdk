import { describe, it, expect } from 'vitest';
import { ContextPruner, TokenCounter, type Message, createAgent, type LLMPort, type LLMOptions, type LLMResponse } from '../src/index.js';

class MockPruningLLM implements LLMPort {
    public readonly providerName = 'mock-pruning-llm';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return {
            text: `Received ${messages.length} messages. System prompt present: ${messages[0]?.role === 'system'}.`,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Pruning stream'; }
}

describe('ContextPruner Unit Tests', () => {
    it('should prune messages within token budget while preserving system prompt and initial user query', () => {
        const counter = new TokenCounter();
        const initialHistory: Message[] = [
            { role: 'system', content: 'You are a customer support agent for Acme Inc.' },
            { role: 'user', content: 'Initial Goal: I need help with my monthly order #99281' },
            { role: 'assistant', content: 'Middle turn 1: Sure! What is your account email address?' },
            { role: 'user', content: 'Middle turn 2: My email is john.doe@example.com' },
            { role: 'assistant', content: 'Middle turn 3: Thank you John. Let me check order #99281.' },
            { role: 'user', content: 'Middle turn 4: Any updates on order #99281?' },
            { role: 'assistant', content: 'Middle turn 5: The order has shipped and is currently in transit.' },
            { role: 'user', content: 'Middle turn 6: Can I change the shipping address now?' },
        ];

        const originalTokens = counter.countMessages(initialHistory);
        expect(originalTokens).toBeGreaterThan(70);

        const pruner = new ContextPruner({
            maxContextTokens: 70,
            preserveSystemPrompt: true,
            preserveInitialUserMsg: true,
        });

        const result = pruner.prune(initialHistory);
        expect(result.messages[0]?.role).toBe('system');
        expect(result.messages[1]?.content).toContain('Initial Goal');
        expect(result.totalTokens).toBeLessThanOrEqual(70);
        expect(result.prunedCount).toBeGreaterThan(0);
    });

    it('should integrate seamlessly into Agent via .maxContextTokens(70)', async () => {
        const initialHistory: Message[] = [
            { role: 'system', content: 'System instruction' },
            { role: 'user', content: 'Initial user query' },
            { role: 'assistant', content: 'Response 1' },
            { role: 'user', content: 'User turn 2' },
        ];

        const agent = createAgent()
            .llm(new MockPruningLLM())
            .maxContextTokens(70)
            .build();

        const result = await agent.run('Latest query', initialHistory);
        expect(result.status).toBe('DONE');
        expect(result.output).toContain('System prompt present: true');
    });
});

import { describe, it, expect } from 'vitest';
import { createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse, LLMFallbackError, FallbackChain } from '../src/index.js';

class FailingLLM implements LLMPort {
    public readonly providerName: string;
    constructor(providerName: string) { this.providerName = providerName; }
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        throw new Error(`Rate limit on ${this.providerName}`);
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        throw new Error(`Service unavailable on ${this.providerName}`);
    }
}

class WorkingLLM implements LLMPort {
    public readonly providerName = 'working-backup';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return { text: 'Hello from backup adapter!' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Hello from backup!'; }
}

describe('FallbackChain Unit Tests', () => {
    it('should failover to working backup when primary fails', async () => {
        const fallbackLogs: string[] = [];
        const chain = new FallbackChain([new FailingLLM('p1'), new FailingLLM('p2'), new WorkingLLM()], {
            onFallback: (from, to, err) => {
                fallbackLogs.push(`Failed ${from} -> ${to}: ${err.message}`);
            },
        });
        const agent = createAgent().llm(chain).build();

        const result = await agent.run('Test fallback');
        expect(result.success).toBe(true);
        expect(result.output).toBe('Hello from backup adapter!');
        expect(fallbackLogs.length).toBe(2);
    });

    it('should accept direct array of adapters in .llm([...])', async () => {
        const agent = createAgent().llm([new FailingLLM('p1'), new WorkingLLM()]).build();
        const result = await agent.run('Test array fallback');
        expect(result.success).toBe(true);
        expect(result.output).toBe('Hello from backup adapter!');
    });

    it('should throw LLMFallbackError with detailed attempts when all adapters fail', async () => {
        const chain = new FallbackChain([new FailingLLM('p1'), new FailingLLM('p2')]);
        const agent = createAgent().llm(chain).build();

        const result = await agent.run('Test failure');
        expect(result.status).toBe('FAILED');
        expect(result.error).toBeInstanceOf(LLMFallbackError);
        if (result.error instanceof LLMFallbackError) {
            expect(result.error.attempts.length).toBe(2);
            expect(result.error.attempts[0]?.provider).toBe('p1');
            expect(result.error.attempts[1]?.provider).toBe('p2');
        }
    });
});

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createTool, createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse } from '../src/index.js';

class MockLLMAdapter implements LLMPort {
    public readonly providerName = 'mock';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;
        if (this.callCount === 1) {
            return { text: "```json\n{\n  \"tool\": \"add\",\n  \"arguments\": { \"a\": 15, \"b\": 25 }\n}\n```" };
        }
        return { text: 'The sum of 15 and 25 is 40.' };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'The sum of 15 and 25 is 40.';
    }
}

describe('AgentRuntime & RunStateMachine Unit Tests', () => {
    it('should execute full agent loop Planning -> Executing -> Verifying -> Done', async () => {
        const addTool = createTool({
            name: 'add',
            description: 'Adds two numbers together',
            inputSchema: z.object({ a: z.number(), b: z.number() }),
            execute: async ({ a, b }: { a: number; b: number }) => ({ sum: a + b }),
        });

        const agent = createAgent()
            .instructions('You are a math assistant.')
            .llm(new MockLLMAdapter())
            .tool(addTool)
            .maxTurns(5)
            .build();

        const result = await agent.run('What is 15 + 25?');
        expect(result.success).toBe(true);
        expect(result.status).toBe('DONE');
        expect(result.output).toBe('The sum of 15 and 25 is 40.');
        expect(result.turns).toBe(2);
        expect(result.messages.length).toBeGreaterThanOrEqual(4);
    });

    it('should fail when max turns is exceeded', async () => {
        const addTool = createTool({
            name: 'add',
            description: 'Adds two numbers together',
            inputSchema: z.object({ a: z.number(), b: z.number() }),
            execute: async ({ a, b }: { a: number; b: number }) => ({ sum: a + b }),
        });

        const agent = createAgent()
            .instructions('Looping math assistant.')
            .llm({
                providerName: 'looping-llm',
                async generate() { return { text: "```json\n{\n  \"tool\": \"add\",\n  \"arguments\": { \"a\": 15, \"b\": 25 }\n}\n```" }; },
                async *stream() { yield ''; }
            })
            .tool(addTool)
            .maxTurns(2)
            .build();

        const result = await agent.run('Infinite add');
        expect(result.status).toBe('FAILED');
        expect(result.error?.message).toContain('maximum turn limit');
    });
});

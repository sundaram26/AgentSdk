import { z } from 'zod';
import { createTool, createAgent, LLMPort, Message, LLMOptions, LLMResponse } from '../src/index.js';

// Mock LLM Adapter for testing state machine transitions deterministically
class MockLLMAdapter implements LLMPort {
    public readonly providerName = 'mock';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;

        // Turn 1: Model requests a tool call
        if (this.callCount === 1) {
            return {
                text: '```json\n{\n  "tool": "add",\n  "arguments": { "a": 15, "b": 25 }\n}\n```',
            };
        }

        // Turn 2: Model receives tool result and produces final answer
        return {
            text: 'The sum of 15 and 25 is 40.',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'The sum of 15 and 25 is 40.';
    }
}

async function main() {
    const addTool = createTool({
        name: 'add',
        description: 'Adds two numbers together',
        inputSchema: z.object({
            a: z.number(),
            b: z.number(),
        }),
        execute: async ({ a, b }) => {
            console.log(`[Tool Execution] Adding ${a} + ${b}...`);
            return { sum: a + b };
        },
    });

    const mockAdapter = new MockLLMAdapter();

    const agent = createAgent()
        .instructions('You are a helpful math assistant.')
        .llm(mockAdapter)
        .tool(addTool)
        .maxTurns(5)
        .build();

    console.log('🚀 Running Agent StateMachine test...');
    const result = await agent.run('What is 15 + 25?');

    console.log('\nResult status:', result.success ? 'SUCCESS' : 'FAILED');
    console.log('Final output:', result.output);
    console.log('Total turns taken:', result.turns);
    console.log('Message history count:', result.messages.length);
}

main().catch(console.error);

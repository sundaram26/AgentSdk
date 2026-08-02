import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createTool, createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse } from '../src/index.js';

class MockStreamingLLM implements LLMPort {
    public readonly providerName = 'mock-streaming';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;
        if (this.callCount === 1) {
            return { text: "```json\n{\n  \"tool\": \"get_weather\",\n  \"arguments\": { \"city\": \"San Francisco\" }\n}\n```" };
        }
        return { text: 'The weather in San Francisco is 68°F and sunny.' };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'The weather ';
        yield 'in San Francisco ';
        yield 'is 68°F and sunny.';
    }
}

describe('Events & Telemetry Tracing Unit Tests', () => {
    it('should emit typed events during streaming run', async () => {
        const weatherTool = createTool({
            name: 'get_weather',
            description: 'Gets current weather for a city',
            inputSchema: z.object({ city: z.string() }),
            execute: async ({ city }: { city: string }) => ({ city, temp: '68°F' }),
        });

        const agent = createAgent()
            .llm(new MockStreamingLLM())
            .tool(weatherTool)
            .build();

        const events: string[] = [];
        for await (const event of agent.stream('What is the weather in SF?')) {
            events.push(event.type);
        }

        expect(events).toContain('text_delta');
        expect(events).toContain('tool_started');
        expect(events).toContain('tool_completed');
        expect(events).toContain('state_changed');
    });

    it('should record hierarchical spans in Tracer and produce valid trace JSON', async () => {
        const agent = createAgent()
            .llm(new MockStreamingLLM())
            .build();

        const result = await agent.run('Hello');
        expect(result.trace).toBeDefined();
        expect(result.trace?.runId).toBeDefined();
        expect(result.trace?.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.trace?.spans.length).toBeGreaterThan(0);

        const exportedTrace = result.trace?.toJSON();
        expect(exportedTrace?.runId).toBe(result.trace?.runId);
        expect(Array.isArray(exportedTrace?.spans)).toBe(true);
    });
});

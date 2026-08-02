import { z } from 'zod';
import {
    createTool,
    createAgent,
    LLMPort,
    Message,
    LLMOptions,
    LLMResponse,
} from '../src/index.js';

class MockStreamingLLM implements LLMPort {
    public readonly providerName = 'mock-streaming';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;

        if (this.callCount === 1) {
            return {
                text: '```json\n{\n  "tool": "get_weather",\n  "arguments": { "city": "San Francisco" }\n}\n```',
            };
        }

        return {
            text: 'The weather in San Francisco is 68°F and sunny.',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'The weather ';
        yield 'in San Francisco ';
        yield 'is 68°F and sunny.';
    }
}

async function main() {
    console.log('=== STEP 5 TEST: Events & Telemetry Tracing ===\n');

    const weatherTool = createTool({
        name: 'get_weather',
        description: 'Gets current weather for a city',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => {
            return { city, temp: '68°F', condition: 'Sunny' };
        },
    });

    const mockLLM = new MockStreamingLLM();

    const agent = createAgent()
        .llm(mockLLM)
        .tool(weatherTool)
        .build();

    console.log('🚀 TEST 1: Streaming Agent Events via for await (const event of agent.stream())...\n');

    const eventStream = agent.stream('What is the weather in SF?');

    for await (const event of eventStream) {
        console.log(`[Event Stream] Type: '${event.type}'`, JSON.stringify(event.payload));
    }

    console.log('\n------------------------------------------------------------');
    console.log('🚀 TEST 2: Inspecting Telemetry Trace JSON on agent.run()...\n');

    const result = await agent.run('What is the weather in SF?');

    console.log('Run Status:', result.status);
    console.log('Trace Run ID:', result.trace?.runId);
    console.log('Trace Duration (ms):', result.trace?.durationMs);
    console.log('Spans Count:', result.trace?.spans.length);

    console.log('\nRecorded Spans Summary:');
    result.trace?.spans.forEach((span) => {
        console.log(`  - Span '${span.name}' (${span.type}): duration=${span.durationMs}ms`);
    });

    console.log('\nFull Trace JSON Export preview:');
    console.log(JSON.stringify(result.trace?.toJSON(), null, 2));
}

main().catch(console.error);

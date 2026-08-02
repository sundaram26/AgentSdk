import { createAgent, createTool, OpenAIAdapter, type LLMPort, type Message, type LLMOptions, type LLMResponse } from 'agent-sdk';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Mock LLM Adapter fallback when OPENAI_API_KEY is not provided
class MockWeatherLLM implements LLMPort {
    public readonly providerName = 'mock-weather-llm';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;
        if (this.callCount === 1) {
            return {
                text: "```json\n{\n  \"tool\": \"get_weather\",\n  \"arguments\": { \"city\": \"San Francisco\" }\n}\n```",
            };
        }
        return {
            text: 'The current weather in San Francisco is 72°F and Sunny with light ocean breeze.',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'The current weather in San Francisco is 72°F and Sunny.';
    }
}

// Define weather lookup tool using Zod input schema
const weatherTool = createTool({
    name: 'get_weather',
    description: 'Get current weather for a city',
    inputSchema: z.object({
        city: z.string().describe('Name of the city'),
    }),
    execute: async ({ city }: { city: string }) => {
        console.log(`  [Tool Executing] Fetching weather data for '${city}'...`);
        return { city, temperature: '72°F', condition: 'Sunny', humidity: '45%' };
    },
});

async function main() {
    console.log('====================================================');
    console.log('🚀 Basic Agent Example — Single Tool & Execution Tracing');
    console.log('====================================================\n');

    // Use real OpenAI if API key present, otherwise fallback to mock adapter
    const apiKey = process.env.OPENAI_API_KEY;
    const llmAdapter = apiKey ? new OpenAIAdapter({ apiKey }) : new MockWeatherLLM();

    if (!apiKey) {
        console.log('ℹ️ No OPENAI_API_KEY detected. Running in deterministic Mock Fallback Mode.\n');
    }

    const agent = createAgent()
        .name('WeatherAssistant')
        .instructions('You are a helpful assistant with real-time weather lookup capabilities.')
        .llm(llmAdapter)
        .tool(weatherTool)
        .debug(true) // Enables formatted CLI debug logger
        .build();

    console.log('Executing prompt: "What is the weather in San Francisco?"\n');
    const result = await agent.run('What is the weather in San Francisco?');

    console.log('\n----------------------------------------------------');
    console.log('Final Result Summary:');
    console.log('  - Status:', result.status);
    console.log('  - Total Turns:', result.turns);
    console.log('  - Output:', result.output);
    console.log('  - Trace Run ID:', result.trace?.runId);
    console.log('  - Total Duration:', `${result.trace?.durationMs}ms`);
    console.log('----------------------------------------------------\n');
}

main().catch(console.error);

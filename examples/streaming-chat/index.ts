import { createAgent, OpenAIAdapter, type LLMPort, type Message, type LLMOptions, type LLMResponse } from 'agent-sdk';
import dotenv from 'dotenv';

dotenv.config();

class MockStreamingLLM implements LLMPort {
    public readonly providerName = 'mock-streaming';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return { text: 'Once upon a time in a distant galaxy, a small star learned to shine brighter than all others.' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const tokens = ['Once ', 'upon ', 'a ', 'time ', 'in ', 'a ', 'distant ', 'galaxy, ', 'a ', 'small ', 'star ', 'shined.'];
        for (const token of tokens) {
            yield token;
        }
    }
}

async function main() {
    console.log('====================================================');
    console.log('🚀 Streaming Chat Example — Real-Time Async Events');
    console.log('====================================================\n');

    const apiKey = process.env.OPENAI_API_KEY;
    const llmAdapter = apiKey ? new OpenAIAdapter({ apiKey }) : new MockStreamingLLM();

    if (!apiKey) {
        console.log('ℹ️ No OPENAI_API_KEY detected. Running in deterministic Mock Fallback Mode.\n');
    }

    const agent = createAgent()
        .instructions('You are a creative storyteller.')
        .llm(llmAdapter)
        .build();

    console.log('Streaming response for prompt: "Tell me a short 1-sentence story about a star."\n');
    process.stdout.write('Streamed Output: ');

    const eventStream = agent.stream('Tell me a short 1-sentence story about a star.');

    for await (const event of eventStream) {
        if (event.type === 'text_delta') {
            process.stdout.write(event.payload.delta);
        }
    }

    console.log('\n\n----------------------------------------------------');
    console.log('Streaming complete!');
    console.log('----------------------------------------------------\n');
}

main().catch(console.error);

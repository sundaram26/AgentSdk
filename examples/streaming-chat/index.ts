import { createAgent, OpenAIAdapter } from 'agent-sdk';

const agent = createAgent()
    .instructions('You are a creative storyteller.')
    .llm(new OpenAIAdapter())
    .build();

async function main() {
    for await (const event of agent.stream('Tell me a 2-sentence story about space.')) {
        if (event.type === 'text_delta') {
            process.stdout.write(event.payload.delta);
        }
    }
}

main().catch(console.error);

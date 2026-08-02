import { createAgent, createTool, OpenAIAdapter } from 'agent-sdk';
import { z } from 'zod';

const weatherTool = createTool({
    name: 'get_weather',
    description: 'Get current weather for a city',
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }) => {
        return { city, temperature: '72°F', condition: 'Sunny' };
    },
});

const agent = createAgent()
    .name('BasicAgent')
    .instructions('You are a helpful assistant with weather lookup capabilities.')
    .llm(new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }))
    .tool(weatherTool)
    .debug(true)
    .build();

async function main() {
    const result = await agent.run('What is the weather in San Francisco?');
    console.log('Final Result:', result.output);
}

main().catch(console.error);

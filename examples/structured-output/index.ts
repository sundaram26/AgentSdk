import { createAgent, OpenAIAdapter } from 'agent-sdk';
import { z } from 'zod';

const UserProfileSchema = z.object({
    name: z.string(),
    age: z.number(),
    interests: z.array(z.string()),
});

const agent = createAgent()
    .instructions('Extract user profile details from conversation.')
    .llm(new OpenAIAdapter())
    .outputSchema(UserProfileSchema)
    .debug(true)
    .build();

async function main() {
    const result = await agent.run('My name is Alice, I am 28 years old, and I love hiking and coding.');
    console.log('Structured Data:', result.structuredData);
}

main().catch(console.error);

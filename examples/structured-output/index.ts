import { createAgent, OpenAIAdapter, type LLMPort, type Message, type LLMOptions, type LLMResponse } from 'agent-sdk';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

class MockStructuredLLM implements LLMPort {
    public readonly providerName = 'mock-structured';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;
        if (this.callCount === 1) {
            return {
                text: "```json\n{\n  \"name\": \"Alice\"\n}\n```",
            };
        }
        return {
            text: "```json\n{\n  \"name\": \"Alice\",\n  \"age\": 28,\n  \"interests\": [\"hiking\", \"coding\", \"design\"]\n}\n```",
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Structured Output'; }
}

const UserProfileSchema = z.object({
    name: z.string().describe('Full name of the user'),
    age: z.number().describe('Age in years'),
    interests: z.array(z.string()).describe('List of user interests or hobbies'),
});

type UserProfile = z.infer<typeof UserProfileSchema>;

async function main() {
    console.log('====================================================');
    console.log('🚀 Structured Output Example — Zod Validation & Self-Repair');
    console.log('====================================================\n');

    const apiKey = process.env.OPENAI_API_KEY;
    const llmAdapter = apiKey ? new OpenAIAdapter({ apiKey }) : new MockStructuredLLM();

    if (!apiKey) {
        console.log('ℹ️ No OPENAI_API_KEY detected. Running in deterministic Mock Fallback Mode.\n');
    }

    const agent = createAgent()
        .instructions('Extract user profile details from the conversation.')
        .llm(llmAdapter)
        .outputSchema(UserProfileSchema)
        .maxSchemaRetries(2)
        .debug(true)
        .build();

    console.log('Executing prompt: "My name is Alice, I am 28 years old, and I love hiking, coding, and design."\n');

    const result = await agent.run<UserProfile>('My name is Alice, I am 28 years old, and I love hiking, coding, and design.');

    console.log('\n----------------------------------------------------');
    console.log('Validated Structured Data Output:');
    console.log('  - Status:', result.status);
    console.log('  - Name:', result.structuredData?.name);
    console.log('  - Age:', result.structuredData?.age);
    console.log('  - Interests:', result.structuredData?.interests.join(', '));
    console.log('----------------------------------------------------\n');
}

main().catch(console.error);

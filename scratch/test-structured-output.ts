import { z } from 'zod';
import {
    createAgent,
    LLMPort,
    Message,
    LLMOptions,
    LLMResponse,
} from '../src/index.js';

class MockStructuredLLM implements LLMPort {
    public readonly providerName = 'mock';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;

        if (this.callCount === 1) {
            // Turn 1: Returns incomplete JSON missing 'confidence' and 'tags'
            return {
                text: '```json\n{\n  "answer": "Paris"\n}\n```',
            };
        }

        // Turn 2 (after self-repair prompt): Returns fully valid JSON conforming to Zod schema
        return {
            text: '```json\n{\n  "answer": "Paris",\n  "confidence": 0.98,\n  "tags": ["capital", "france"]\n}\n```',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Done.';
    }
}

async function main() {
    console.log('=== STEP 4 TEST: Structured Output Validation & Self-Repair ===\n');

    const UserOutputSchema = z.object({
        answer: z.string(),
        confidence: z.number(),
        tags: z.array(z.string()),
    });

    type UserOutput = z.infer<typeof UserOutputSchema>;

    const mockLLM = new MockStructuredLLM();

    const agent = createAgent()
        .llm(mockLLM)
        .outputSchema(UserOutputSchema)
        .maxSchemaRetries(2)
        .build();

    console.log('🚀 Running Agent with Structured Output Schema...');
    const result = await agent.run<UserOutput>('What is the capital of France?');

    console.log('\nRun Status:', result.status);
    console.log('Total Message Turn Count:', result.messages.length);
    console.log('Validated Structured Data:', result.structuredData);

    if (result.structuredData) {
        console.log(`Answer: ${result.structuredData.answer}`);
        console.log(`Confidence: ${result.structuredData.confidence}`);
        console.log(`Tags: ${result.structuredData.tags.join(', ')}`);
    }

    console.log('\n--- Conversation History (showing self-repair prompt) ---');
    result.messages.forEach((m, idx) => {
        console.log(`  [${idx + 1}] (${m.role}): ${m.content}`);
    });
}

main().catch(console.error);

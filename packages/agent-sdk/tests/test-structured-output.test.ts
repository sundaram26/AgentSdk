import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse } from '../src/index.js';

class MockStructuredLLM implements LLMPort {
    public readonly providerName = 'mock';
    private callCount = 0;

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        this.callCount += 1;
        if (this.callCount === 1) {
            return { text: "```json\n{\n  \"answer\": \"Paris\"\n}\n```" };
        }
        return { text: "```json\n{\n  \"answer\": \"Paris\",\n  \"confidence\": 0.98,\n  \"tags\": [\"capital\", \"france\"]\n}\n```" };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Done.'; }
}

describe('Structured Output Validator & Self-Repair Unit Tests', () => {
    it('should trigger self-repair prompt on invalid JSON and succeed on retry', async () => {
        const Schema = z.object({
            answer: z.string(),
            confidence: z.number(),
            tags: z.array(z.string()),
        });

        type SchemaType = z.infer<typeof Schema>;

        const agent = createAgent()
            .llm(new MockStructuredLLM())
            .outputSchema(Schema)
            .maxSchemaRetries(2)
            .build();

        const result = await agent.run<SchemaType>('What is the capital of France?');
        expect(result.status).toBe('DONE');
        expect(result.structuredData).toEqual({
            answer: 'Paris',
            confidence: 0.98,
            tags: ['capital', 'france'],
        });
        expect(result.messages.some((m) => m.content.includes('failed schema validation'))).toBe(true);
    });
});

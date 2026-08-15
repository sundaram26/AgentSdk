import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { createAgent, type LLMPort, type Message, type LLMOptions, type LLMResponse, FileMemoryStore } from '../src/index.js';

class MockMemoryLLM implements LLMPort {
    public readonly providerName = 'mock-memory';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const userMsg = messages[messages.length - 1]?.content || '';
        if (userMsg.includes('What do you know about me?')) {
            return { text: 'You live in San Francisco and prefer TypeScript!' };
        }
        return { text: 'Memory response' };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield 'Memory'; }
}

describe('Memory Engine Unit Tests', () => {
    it('should store, retrieve, delete facts, and load prompt context per session', async () => {
        const sessionsDir = path.resolve('tests/sessions');
        const fileStore = new FileMemoryStore({ dirPath: sessionsDir });
        const sessionId = 'test_session_vitest';

        await fileStore.clear(sessionId);
        const agent = createAgent().llm(new MockMemoryLLM()).memory(fileStore).build();

        const fact1 = await agent.memory.addFact(sessionId, 'User lives in San Francisco', 'location');
        const fact2 = await agent.memory.addFact(sessionId, 'User prefers TypeScript', 'preference');
        await agent.memory.addEpisode(sessionId, 'Session 2026: Built Guardrails Engine');

        let facts = await agent.memory.getFacts(sessionId);
        expect(facts.length).toBe(2);

        const episodes = await agent.memory.getEpisodes(sessionId);
        expect(episodes.length).toBe(1);

        const context = await agent.memory.loadMemoryContext(sessionId);
        expect(context.promptContext).toContain('User lives in San Francisco');
        expect(context.promptContext).toContain('User prefers TypeScript');
        expect(context.promptContext).toContain('Session 2026: Built Guardrails Engine');

        // Delete fact
        const deleted = await agent.memory.deleteFact(sessionId, fact1.id);
        expect(deleted).toBe(true);
        facts = await agent.memory.getFacts(sessionId);
        expect(facts.length).toBe(1);
        expect(facts[0]?.id).toBe(fact2.id);

        // Run agent with session memory context
        const runResult = await agent.run('What do you know about me?', { sessionId });
        expect(runResult.status).toBe('DONE');
        expect(runResult.output).toContain('San Francisco');
    });
});

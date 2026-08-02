import * as path from 'path';
import {
    createAgent,
    LLMPort,
    Message,
    LLMOptions,
    LLMResponse,
    FileMemoryStore,
} from '../src/index.js';

class MockMemoryLLM implements LLMPort {
    public readonly providerName = 'mock-memory-llm';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
        const userMsg = messages[messages.length - 1]?.content || '';

        if (userMsg.includes('What do you know about me?')) {
            return {
                text: 'Based on my memory, you live in San Francisco, your preferred language is TypeScript, and we previously built the Guardrails Engine.',
            };
        }

        if (userMsg.includes('What language do I prefer?')) {
            return {
                text: 'You prefer TypeScript!',
            };
        }

        return {
            text: `System Memory Context Length: ${systemMsg.length} characters. Response generated.`,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Memory stream';
    }
}

async function main() {
    console.log('=== STEP 8 TEST: Enterprise Multi-Tier Memory Engine ===\n');

    const sessionsDir = path.resolve('scratch/sessions');
    const fileStore = new FileMemoryStore({ dirPath: sessionsDir });
    const sessionId = 'user_session_2026';

    // Clear previous test run state
    await fileStore.clear(sessionId);

    const agent = createAgent()
        .llm(new MockMemoryLLM())
        .memory(fileStore)
        .instructions('You are a memory-aware assistant.')
        .build();

    console.log('🚀 Pre-populating Factual and Episodic Memories for sessionId:', sessionId);
    await agent.memory.addFact(sessionId, 'User lives in San Francisco', 'location');
    await agent.memory.addFact(sessionId, 'User prefers TypeScript', 'preference');
    await agent.memory.addEpisode(sessionId, 'Session 2026-08-01: Built Guardrails Engine');

    const facts = await agent.memory.getFacts(sessionId);
    console.log(`Stored Facts Count: ${facts.length}`);
    facts.forEach((f) => console.log(`  - Fact: "${f.fact}" (${f.category})`));

    console.log('\n------------------------------------------------------------');
    console.log('🚀 TURN 1: Querying Agent with sessionId...\n');

    const result1 = await agent.run('What do you know about me?', { sessionId });

    console.log('Run Status:', result1.status);
    console.log('Agent Output:', result1.output);

    console.log('\n------------------------------------------------------------');
    console.log('🚀 TURN 2: Multi-Turn Persistence Query...\n');

    const result2 = await agent.run('What language do I prefer?', { sessionId });

    console.log('Run Status:', result2.status);
    console.log('Agent Output:', result2.output);
}

main().catch(console.error);

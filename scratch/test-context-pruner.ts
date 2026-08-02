import {
    ContextPruner,
    TokenCounter,
    Message,
    createAgent,
    LLMPort,
    LLMOptions,
    LLMResponse,
} from '../src/index.js';

class MockPruningLLM implements LLMPort {
    public readonly providerName = 'mock-pruning-llm';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return {
            text: `Received ${messages.length} messages. System prompt present: ${messages[0]?.role === 'system'}.`,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Pruning stream';
    }
}

async function main() {
    console.log('=== STEP 9 TEST: Context Window Pruning & Token Budgeting ===\n');

    const counter = new TokenCounter();

    const initialHistory: Message[] = [
        { role: 'system', content: 'You are a helpful customer support agent for Acme Inc.' },
        { role: 'user', content: 'Initial Goal: I need help with my monthly order #99281' },
        { role: 'assistant', content: 'Middle turn 1: Sure! What is your account email address?' },
        { role: 'user', content: 'Middle turn 2: My email is john.doe@example.com' },
        { role: 'assistant', content: 'Middle turn 3: Thank you John. Let me check order #99281.' },
        { role: 'user', content: 'Middle turn 4: Any updates on order #99281?' },
        { role: 'assistant', content: 'Middle turn 5: The order has shipped and is currently in transit.' },
        { role: 'user', content: 'Middle turn 6: Can I change the shipping address now?' },
    ];

    const unprunedTokens = counter.countMessages(initialHistory);
    console.log(`Original Message Count: ${initialHistory.length}`);
    console.log(`Original Total Tokens: ${unprunedTokens}`);

    console.log('\n------------------------------------------------------------');
    console.log('🚀 Running ContextPruner with maxContextTokens = 70...\n');

    const pruner = new ContextPruner({
        maxContextTokens: 70,
        preserveSystemPrompt: true,
        preserveInitialUserMsg: true,
    });

    const pruneResult = pruner.prune(initialHistory);

    console.log(`Pruned Message Count: ${pruneResult.messages.length}`);
    console.log(`Pruned Tokens: ${pruneResult.totalTokens}`);
    console.log(`Messages Dropped: ${pruneResult.prunedCount}`);

    console.log('\nPruned Message Flow:');
    pruneResult.messages.forEach((m, idx) => {
        console.log(`  [${idx + 1}] (${m.role}): "${m.content}"`);
    });

    console.log('\n------------------------------------------------------------');
    console.log('🚀 Testing Agent with .maxContextTokens(70)...\n');

    const agent = createAgent()
        .llm(new MockPruningLLM())
        .maxContextTokens(70)
        .build();

    const result = await agent.run('Latest question: What is the estimated delivery date?', initialHistory);

    console.log('Run Status:', result.status);
    console.log('Agent Output:', result.output);
}

main().catch(console.error);

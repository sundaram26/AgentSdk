import {
    createAgent,
    LLMPort,
    Message,
    LLMOptions,
    LLMResponse,
    LLMFallbackError,
    FallbackChain,
} from '../src/index.js';

class FailingLLM implements LLMPort {
    public readonly providerName: string;

    constructor(providerName: string) {
        this.providerName = providerName;
    }

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        throw new Error(`HTTP 429: Rate limit exceeded on provider '${this.providerName}'`);
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        throw new Error(`HTTP 503: Service Unavailable on provider '${this.providerName}'`);
    }
}

class WorkingLLM implements LLMPort {
    public readonly providerName = 'working-backup-llm';

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return {
            text: 'Hello from the resilient backup LLM adapter!',
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        yield 'Hello ';
        yield 'from ';
        yield 'backup!';
    }
}

async function main() {
    console.log('=== STEP 6 TEST: Multi-Provider Fallback Chain ===\n');

    const failingPrimary = new FailingLLM('openai-primary');
    const failingSecondary = new FailingLLM('claude-secondary');
    const workingBackup = new WorkingLLM();

    console.log('🚀 TEST 1: Automatic Fallback from Primary → Secondary → Working Backup...\n');

    let fallbackLog: string[] = [];

    const chain = new FallbackChain([failingPrimary, failingSecondary, workingBackup], {
        onFallback: (from, to, error) => {
            const msg = `[Fallback Event] Failed on '${from}' (${error.message}) → Falling back to '${to}'`;
            fallbackLog.push(msg);
            console.log(msg);
        },
    });

    const agent = createAgent()
        .llm(chain)
        .build();

    const result = await agent.run('Test multi-provider resilience');

    console.log('\nRun Success:', result.success);
    console.log('Run Status:', result.status);
    console.log('Final Agent Output:', result.output);
    console.log('Fallback Trigger Count:', fallbackLog.length);

    console.log('\n------------------------------------------------------------');
    console.log('🚀 TEST 2: Array of Adapters passed directly to .llm([...])...\n');

    const agentWithArray = createAgent()
        .llm([failingPrimary, workingBackup])
        .build();

    const result2 = await agentWithArray.run('Direct array fallback test');
    console.log('Run 2 Output:', result2.output);

    console.log('\n------------------------------------------------------------');
    console.log('🚀 TEST 3: All Providers Fail → Expect LLMFallbackError on RunResult...\n');

    const failingChainAgent = createAgent()
        .llm([failingPrimary, failingSecondary])
        .build();

    const failResult = await failingChainAgent.run('Should fail');

    console.log('Run Status:', failResult.status);
    console.log('Is LLMFallbackError:', failResult.error instanceof LLMFallbackError);

    if (failResult.error instanceof LLMFallbackError) {
        console.log('✅ Successfully returned typed LLMFallbackError on RunResult!');
        console.log('Error Message:', failResult.error.message);
        console.log('Attempts Count:', failResult.error.attempts.length);
        failResult.error.attempts.forEach((att) => {
            console.log(`   - Provider '${att.provider}': ${att.error.message}`);
        });
    } else {
        console.error('❌ Expected LLMFallbackError but got:', failResult.error);
    }
}

main().catch(console.error);

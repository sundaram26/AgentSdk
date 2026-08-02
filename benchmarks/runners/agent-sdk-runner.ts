import { createAgent, OpenAIAdapter, PromptInjectionRule } from 'agent-sdk';

export async function runBenchmarkTrial(input: string) {
    const agent = createAgent()
        .llm(new OpenAIAdapter())
        .inputGuardrail(new PromptInjectionRule())
        .build();

    const start = Date.now();
    const result = await agent.run(input);
    return {
        latencyMs: Date.now() - start,
        success: result.success,
        status: result.status,
    };
}

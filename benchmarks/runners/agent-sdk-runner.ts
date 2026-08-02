import { createAgent, OpenAIAdapter, type LLMPort, type Message, type LLMOptions, type LLMResponse } from 'agent-sdk';
import { CRUD_TASK_PROMPT, validateCrudOutput } from '../suites/crud-generation/crud-task.js';

class MockCrudLLM implements LLMPort {
    public readonly providerName = 'mock-crud-llm';
    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        return {
            text: `[
  {
    "method": "GET",
    "path": "/users",
    "description": "List all users",
    "handlerLogic": "return db.users.findMany();"
  },
  {
    "method": "GET",
    "path": "/users/:id",
    "description": "Get user by ID",
    "handlerLogic": "return db.users.findUnique({ where: { id } });"
  },
  {
    "method": "POST",
    "path": "/users",
    "description": "Create new user",
    "handlerLogic": "return db.users.create({ data: body });"
  },
  {
    "method": "DELETE",
    "path": "/users/:id",
    "description": "Delete user by ID",
    "handlerLogic": "return db.users.delete({ where: { id } });"
  }
]`,
        };
    }
    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> { yield ''; }
}

export interface MetricResult {
    success: boolean;
    latencyMs: number;
    turns: number;
    score: number;
    output: string;
}

export async function runAgentSdkTrial(apiKey?: string): Promise<MetricResult> {
    const adapter = apiKey ? new OpenAIAdapter({ apiKey }) : new MockCrudLLM();
    const agent = createAgent()
        .instructions('You are a senior backend TypeScript developer.')
        .llm(adapter)
        .build();

    const start = Date.now();
    const result = await agent.run(CRUD_TASK_PROMPT);
    const latencyMs = Date.now() - start;

    const validation = validateCrudOutput(result.output);

    return {
        success: result.success && validation.valid,
        latencyMs,
        turns: result.turns,
        score: validation.score,
        output: result.output,
    };
}

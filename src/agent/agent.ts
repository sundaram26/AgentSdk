import type { AgentBuilder } from './agent-builder.js';
import { AgentRuntime } from '../runtime/AgentRuntime.js';
import type { RunContext, RunResult } from '../runtime/types.js';
import type { ApprovalRequest } from '../guardrails/types.js';

export class Agent {
    private runtime: AgentRuntime;
    private builderConfig: AgentBuilder;
    private activeContext?: RunContext | undefined;

    constructor(builder: AgentBuilder) {
        this.builderConfig = builder;
        this.runtime = new AgentRuntime(builder.llmPort!, builder.toolRegistry);
    }

    public async run<TData = unknown>(input: string): Promise<RunResult<TData>> {
        this.activeContext = {
            llm: this.builderConfig.llmPort!,
            tools: this.builderConfig.toolRegistry,
            messages: [{ role: 'user', content: input }],
            systemInstruction: this.builderConfig.instructionsText,
            currentTurn: 1,
            maxTurns: this.builderConfig.maxTurnsCount,
            maxReasks: this.builderConfig.maxReasksCount,
            model: this.builderConfig.modelName,
            temperature: this.builderConfig.temperatureValue,
            maxTokens: this.builderConfig.maxTokensValue,
            inputPipeline: this.builderConfig.inputPipeline,
            toolPipeline: this.builderConfig.toolPipeline,
            outputPipeline: this.builderConfig.outputPipeline,
            approvalGate: this.builderConfig.approvalGate,
            outputSchema: this.builderConfig.outputSchemaObject,
            maxSchemaRetries: this.builderConfig.maxSchemaRetriesCount,
        };

        return this.runtime.run<TData>(this.activeContext);
    }

    public getPendingApprovals(): ApprovalRequest[] {
        return this.builderConfig.approvalGate.getPendingRequests();
    }

    public async resume<TData = unknown>(approvalId: string, approved: boolean): Promise<RunResult<TData>> {
        if (!this.activeContext) {
            throw new Error('Cannot resume: No active run context found for this agent.');
        }

        return this.runtime.resume<TData>(this.activeContext, approvalId, approved);
    }
}
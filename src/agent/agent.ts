import type { AgentBuilder } from './agent-builder.js';
import { AgentRuntime } from '../runtime/AgentRuntime.js';
import type { RunContext, RunResult } from '../runtime/types.js';
import type { ApprovalRequest } from '../guardrails/types.js';
import { RunEventEmitter } from '../events/RunEventEmitter.js';
import { Tracer } from '../tracing/Tracer.js';
import type { SutraEvent } from '../events/types.js';

export class Agent {
    private runtime: AgentRuntime;
    private builderConfig: AgentBuilder;
    private activeContexts = new Map<string, RunContext>();

    constructor(builder: AgentBuilder) {
        this.builderConfig = builder;
        this.runtime = new AgentRuntime(builder.llmPort!, builder.toolRegistry);
    }

    public async run<TData = unknown>(input: string): Promise<RunResult<TData>> {
        const emitter = new RunEventEmitter();
        const tracer = new Tracer();

        const context: RunContext = {
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
            eventEmitter: emitter,
            tracer: tracer,
        };

        const result = await this.runtime.run<TData>(context);

        if (result.status === 'AWAITING_APPROVAL' && result.pendingApproval) {
            this.activeContexts.set(result.pendingApproval.id, context);
        }

        return result;
    }

    public stream(input: string): AsyncIterable<SutraEvent> {
        const emitter = new RunEventEmitter();
        const tracer = new Tracer();

        const context: RunContext = {
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
            eventEmitter: emitter,
            tracer: tracer,
        };

        // Start background run and store context if paused
        this.runtime.run(context).then((result) => {
            if (result.status === 'AWAITING_APPROVAL' && result.pendingApproval) {
                this.activeContexts.set(result.pendingApproval.id, context);
            }
        }).catch((err) => {
            emitter.emitEvent({
                type: 'run_failed',
                payload: { error: err instanceof Error ? err : new Error(String(err)) },
            });
        });

        return emitter.toAsyncIterable();
    }

    public getPendingApprovals(): ApprovalRequest[] {
        return this.builderConfig.approvalGate.getPendingRequests();
    }

    public async resume<TData = unknown>(approvalId: string, approved: boolean): Promise<RunResult<TData>> {
        const context = this.activeContexts.get(approvalId);
        if (!context) {
            throw new Error(`Cannot resume: No pending approval context found for approval ID '${approvalId}'.`);
        }

        const result = await this.runtime.resume<TData>(context, approvalId, approved);
        this.activeContexts.delete(approvalId);
        return result;
    }
}
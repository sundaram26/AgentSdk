import type { AgentBuilder } from './agent-builder.js';
import { AgentRuntime } from '../runtime/AgentRuntime.js';
import type { RunContext, RunResult } from '../runtime/types.js';
import type { ApprovalRequest } from '../guardrails/types.js';
import { RunEventEmitter } from '../events/RunEventEmitter.js';
import { Tracer } from '../tracing/Tracer.js';
import type {
    AgentEvent,
    StateChangedPayload,
    ToolStartedPayload,
    ToolCompletedPayload,
    GuardrailTriggeredPayload,
    RunCompletedPayload,
    RunFailedPayload,
} from '../events/types.js';
import type { Message } from '../llm/types.js';
import type { MemoryManager } from '../memory/MemoryManager.js';

export interface AgentRunOptions {
    sessionId?: string | undefined;
    history?: Message[] | undefined;
    maxEventBufferSize?: number | undefined;
}

export class Agent {
    private runtime: AgentRuntime;
    private builderConfig: AgentBuilder;
    private activeContexts = new Map<string, RunContext>();

    public readonly memory: MemoryManager;

    constructor(builder: AgentBuilder) {
        this.builderConfig = builder;
        this.runtime = new AgentRuntime(builder.llmPort!, builder.toolRegistry);
        this.memory = builder.memoryManager;
    }

    private setupEmitter(emitter: RunEventEmitter): void {
        // Attach global builder event handlers
        for (const handler of this.builderConfig.globalEventHandlers) {
            emitter.on('event', handler);
        }

        // Attach visual debug logger if developer enabled .debug()
        if (this.builderConfig.debugLogger) {
            const logger = this.builderConfig.debugLogger;
            emitter.onStateChanged((p: StateChangedPayload) => logger(`State: ${p.from} ➔ ${p.to}`));
            emitter.onToolStarted((p: ToolStartedPayload) => logger(`Tool Start: ${p.toolName} (args: ${JSON.stringify(p.args)})`));
            emitter.onToolCompleted((p: ToolCompletedPayload) => logger(`Tool Complete: ${p.toolName} (${p.durationMs}ms, success: ${p.success})`));
            emitter.onGuardrailTriggered((p: GuardrailTriggeredPayload) => logger(`Guardrail Triggered: stage=${p.stage} rule=${p.ruleName} action=${p.action}`));
            emitter.onRunCompleted((p: RunCompletedPayload) => logger(`Run Completed (${p.turns} turns)`));
            emitter.onRunFailed((p: RunFailedPayload) => logger(`Run Failed: ${p.error.message}`));
        }
    }

    public async run<TData = unknown>(input: string, options?: AgentRunOptions | Message[]): Promise<RunResult<TData>> {
        const opts: AgentRunOptions = Array.isArray(options) ? { history: options } : options || {};
        const emitter = new RunEventEmitter({
            maxBufferSize: opts.maxEventBufferSize ?? this.builderConfig.eventBufferLimitValue,
        });
        this.setupEmitter(emitter);

        const tracer = new Tracer();
        const messages: Message[] = opts.history ? [...opts.history, { role: 'user', content: input }] : [{ role: 'user', content: input }];

        const context: RunContext = {
            llm: this.builderConfig.llmPort!,
            tools: this.builderConfig.toolRegistry,
            messages,
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
            sessionId: opts.sessionId,
            memoryManager: this.memory,
            maxContextTokens: this.builderConfig.maxContextTokensValue,
            contextPruner: this.builderConfig.contextPrunerInstance,
            stateFactory: this.builderConfig.stateFactoryInstance,
        };

        const result = await this.runtime.run<TData>(context);

        if (result.status === 'AWAITING_APPROVAL' && result.pendingApproval) {
            this.activeContexts.set(result.pendingApproval.id, context);
        }

        return result;
    }

    public stream(input: string, options?: AgentRunOptions | Message[]): AsyncIterable<AgentEvent> {
        const opts: AgentRunOptions = Array.isArray(options) ? { history: options } : options || {};
        const emitter = new RunEventEmitter({
            maxBufferSize: opts.maxEventBufferSize ?? this.builderConfig.eventBufferLimitValue,
        });
        this.setupEmitter(emitter);

        const tracer = new Tracer();
        const messages: Message[] = opts.history ? [...opts.history, { role: 'user', content: input }] : [{ role: 'user', content: input }];

        const context: RunContext = {
            llm: this.builderConfig.llmPort!,
            tools: this.builderConfig.toolRegistry,
            messages,
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
            sessionId: opts.sessionId,
            memoryManager: this.memory,
            maxContextTokens: this.builderConfig.maxContextTokensValue,
            contextPruner: this.builderConfig.contextPrunerInstance,
            stateFactory: this.builderConfig.stateFactoryInstance,
        };

        // Start background run and store context if paused
        this.runtime.run(context).then((result: RunResult) => {
            if (result.status === 'AWAITING_APPROVAL' && result.pendingApproval) {
                this.activeContexts.set(result.pendingApproval.id, context);
            }
        }).catch((err: unknown) => {
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
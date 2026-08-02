import { RunStateMachine } from './RunStateMachine.js';
import type { LLMPort } from '../llm/LLMPort.js';
import type { ToolRegistry } from '../tools/ToolRegistry.js';
import type { RunContext, RunOptions, RunResult } from './types.js';
import { Tracer } from '../tracing/Tracer.js';

export class AgentRuntime {
    constructor(
        private readonly llm: LLMPort,
        private readonly tools: ToolRegistry
    ) {}

    public async run<TData = unknown>(input: string | RunContext, options?: RunOptions): Promise<RunResult<TData>> {
        let context: RunContext;

        if (typeof input === 'string') {
            if (!options) {
                throw new Error('RunOptions required when passing string input to AgentRuntime.run()');
            }
            context = {
                llm: this.llm,
                tools: this.tools,
                messages: [{ role: 'user', content: input }],
                systemInstruction: options.systemInstruction,
                currentTurn: 1,
                maxTurns: options.maxTurns ?? 10,
                model: options.model,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                inputPipeline: options.inputPipeline,
                toolPipeline: options.toolPipeline,
                outputPipeline: options.outputPipeline,
                approvalGate: options.approvalGate,
                outputSchema: options.outputSchema,
                maxSchemaRetries: options.maxSchemaRetries,
                eventEmitter: options.eventEmitter,
                tracer: options.tracer || new Tracer(),
                sessionId: options.sessionId,
                memoryManager: options.memoryManager,
                maxContextTokens: options.maxContextTokens,
                contextPruner: options.contextPruner,
            };
        } else {
            context = input;
            if (!context.tracer) {
                context.tracer = new Tracer();
            }
        }

        const stateMachine = new RunStateMachine(undefined, context.stateFactory);

        while (!stateMachine.isTerminal && stateMachine.status !== 'AWAITING_APPROVAL') {
            await stateMachine.step(context);
        }

        const trace = context.tracer?.endRun(stateMachine.status);

        if (stateMachine.status === 'DONE') {
            if (context.memoryManager && context.sessionId) {
                await context.memoryManager.saveRunMemory(context.sessionId, context.messages);
            }

            const finalOutput = context.lastOutput || '';
            if (context.eventEmitter) {
                context.eventEmitter.emitEvent({
                    type: 'run_completed',
                    payload: { output: finalOutput, turns: context.currentTurn },
                });
            }

            return {
                success: true,
                status: 'DONE',
                output: finalOutput,
                turns: context.currentTurn,
                messages: context.messages,
                guardrailReports: context.guardrailReports,
                structuredData: context.structuredData as TData | undefined,
                trace,
            };
        }

        if (stateMachine.status === 'AWAITING_APPROVAL') {
            return {
                success: false,
                status: 'AWAITING_APPROVAL',
                output: context.lastOutput || '',
                turns: context.currentTurn,
                messages: context.messages,
                pendingApproval: context.pendingApprovalRequest,
                guardrailReports: context.guardrailReports,
                structuredData: context.structuredData as TData | undefined,
                trace,
            };
        }

        const err = context.error || new Error('Run failed without explicit error details');
        if (context.eventEmitter) {
            context.eventEmitter.emitEvent({
                type: 'run_failed',
                payload: { error: err },
            });
        }

        return {
            success: false,
            status: 'FAILED',
            output: context.lastOutput || '',
            turns: context.currentTurn,
            messages: context.messages,
            error: err,
            guardrailReports: context.guardrailReports,
            structuredData: context.structuredData as TData | undefined,
            trace,
        };
    }

    public async resume<TData = unknown>(context: RunContext, approvalId: string, approved: boolean): Promise<RunResult<TData>> {
        if (!context.approvalGate) {
            throw new Error('Cannot resume: No ApprovalGate configured on run context.');
        }

        const resolved = context.approvalGate.resolveRequest(approvalId, approved);
        if (!resolved) {
            throw new Error(`Approval request with ID '${approvalId}' was not found or is not pending.`);
        }

        return this.run<TData>(context);
    }
}

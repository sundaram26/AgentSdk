import { RunStateMachine } from './RunStateMachine.js';
import type { LLMPort } from '../llm/LLMPort.js';
import type { ToolRegistry } from '../tools/ToolRegistry.js';
import type { RunContext, RunOptions, RunResult } from './types.js';

export class AgentRuntime {
    constructor(
        private readonly llm: LLMPort,
        private readonly tools: ToolRegistry
    ) {}

    public async run(input: string | RunContext, options?: RunOptions): Promise<RunResult> {
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
            };
        } else {
            context = input;
        }

        const stateMachine = new RunStateMachine();

        while (!stateMachine.isTerminal && stateMachine.status !== 'AWAITING_APPROVAL') {
            await stateMachine.step(context);
        }

        if (stateMachine.status === 'DONE') {
            return {
                success: true,
                status: 'DONE',
                output: context.lastOutput || '',
                turns: context.currentTurn,
                messages: context.messages,
                guardrailReports: context.guardrailReports,
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
            };
        }

        return {
            success: false,
            status: 'FAILED',
            output: context.lastOutput || '',
            turns: context.currentTurn,
            messages: context.messages,
            error: context.error || new Error('Run failed without explicit error details'),
            guardrailReports: context.guardrailReports,
        };
    }

    public async resume(context: RunContext, approvalId: string, approved: boolean): Promise<RunResult> {
        if (!context.approvalGate) {
            throw new Error('Cannot resume: No ApprovalGate configured on run context.');
        }

        const resolved = context.approvalGate.resolveRequest(approvalId, approved);
        if (!resolved) {
            throw new Error(`Approval request with ID '${approvalId}' was not found or is not pending.`);
        }

        return this.run(context);
    }
}

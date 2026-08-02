import { AgentState } from './State.js';
import { PlanningState } from './PlanningState.js';
import { FailedState } from './FailedState.js';
import { AwaitingApprovalState } from './AwaitingApprovalState.js';
import { GuardrailError } from '../../guardrails/GuardrailError.js';
import type { RunContext, RunStatus } from '../types.js';

export class ExecutingState extends AgentState {
    public readonly status: RunStatus = 'EXECUTING';

    public async execute(context: RunContext): Promise<AgentState> {
        const toolCalls = context.pendingToolCalls;
        if (!toolCalls || toolCalls.length === 0) {
            return new PlanningState();
        }

        for (const toolCall of toolCalls) {
            // 1. Evaluate Tool Guardrails
            if (context.toolPipeline) {
                const { report } = await context.toolPipeline.execute({
                    toolName: toolCall.name,
                    args: toolCall.arguments,
                });

                context.guardrailReports = context.guardrailReports || [];
                context.guardrailReports.push(report);

                if (!report.passed) {
                    const blockEval = report.evaluations.find((e) => e.actionTaken === 'block');
                    if (blockEval) {
                        return new FailedState(
                            new GuardrailError(blockEval.ruleName, blockEval.reason || 'Tool execution blocked by guardrail policy')
                        );
                    }

                    const pauseEval = report.evaluations.find((e) => e.actionTaken === 'pause');
                    if (pauseEval && context.approvalGate) {
                        const approvalReq = context.approvalGate.createRequest(
                            toolCall.name,
                            toolCall.arguments,
                            pauseEval.reason || 'Tool requires human approval'
                        );
                        context.pendingApprovalRequest = approvalReq;
                        return new AwaitingApprovalState();
                    }
                }
            }

            // 2. Execute Tool
            const executionResult = await context.tools.executeTool(
                toolCall.name,
                toolCall.arguments
            );

            if (executionResult.success) {
                context.messages.push({
                    role: 'assistant',
                    content: `[Tool Call Result for ${toolCall.name}]: ${JSON.stringify(executionResult.result)}`,
                });
            } else {
                context.messages.push({
                    role: 'assistant',
                    content: `[Tool Call Failed for ${toolCall.name}]: ${executionResult.error.message}`,
                });
            }
        }

        context.pendingToolCalls = undefined;
        context.currentTurn += 1;

        // Check max turns guard
        if (context.currentTurn > context.maxTurns) {
            return new FailedState(
                new Error(`Run exceeded maximum turn limit of ${context.maxTurns}`)
            );
        }

        // Return to PlanningState for the next turn
        return new PlanningState();
    }
}

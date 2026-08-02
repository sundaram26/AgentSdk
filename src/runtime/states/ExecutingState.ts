import { AgentState } from './State.js';
import { defaultStateFactory } from './StateFactory.js';
import { GuardrailError } from '../../guardrails/GuardrailError.js';
import type { RunContext, RunStatus } from '../types.js';

export class ExecutingState extends AgentState {
    public readonly status: RunStatus = 'EXECUTING';

    public async execute(context: RunContext): Promise<AgentState> {
        const factory = context.stateFactory ?? defaultStateFactory;

        const toolCalls = context.pendingToolCalls;
        if (!toolCalls || toolCalls.length === 0) {
            return factory.create('PLANNING');
        }

        for (const toolCall of toolCalls) {
            // Emit tool_started event
            if (context.eventEmitter) {
                context.eventEmitter.emitEvent({
                    type: 'tool_started',
                    payload: { toolName: toolCall.name, args: toolCall.arguments },
                });
            }

            const toolSpanId = context.tracer?.startSpan(`tool_${toolCall.name}`, 'tool', {
                toolName: toolCall.name,
                arguments: toolCall.arguments,
            });

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
                        if (toolSpanId && context.tracer) {
                            context.tracer.endSpan(toolSpanId, new Error(blockEval.reason));
                        }
                        return factory.create(
                            'FAILED',
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
                        if (toolSpanId && context.tracer) {
                            context.tracer.endSpan(toolSpanId, undefined, { status: 'AWAITING_APPROVAL' });
                        }
                        return factory.create('AWAITING_APPROVAL');
                    }
                }
            }

            // 2. Execute Tool
            const startTime = Date.now();
            const executionResult = await context.tools.executeTool(
                toolCall.name,
                toolCall.arguments
            );
            const durationMs = Date.now() - startTime;

            if (toolSpanId && context.tracer) {
                context.tracer.endSpan(
                    toolSpanId,
                    executionResult.success ? undefined : executionResult.error,
                    { result: executionResult.success ? executionResult.result : undefined }
                );
            }

            // Emit tool_completed event
            if (context.eventEmitter) {
                context.eventEmitter.emitEvent({
                    type: 'tool_completed',
                    payload: {
                        toolName: toolCall.name,
                        result: executionResult.success ? executionResult.result : executionResult.error.message,
                        durationMs,
                        success: executionResult.success,
                    },
                });
            }

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
            return factory.create('FAILED', new Error(`Run exceeded maximum turn limit of ${context.maxTurns}`));
        }

        // Return to PlanningState for the next turn
        return factory.create('PLANNING');
    }
}

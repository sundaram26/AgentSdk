import { AgentState } from './State.js';
import { ExecutingState } from './ExecutingState.js';
import { FailedState } from './FailedState.js';
import type { RunContext, RunStatus } from '../types.js';

export class AwaitingApprovalState extends AgentState {
    public readonly status: RunStatus = 'AWAITING_APPROVAL';

    public async execute(context: RunContext): Promise<AgentState> {
        const approval = context.pendingApprovalRequest;
        if (!approval) {
            return new ExecutingState();
        }

        if (context.approvalGate) {
            const latest = await context.approvalGate.getRequest(approval.id);
            if (latest) {
                approval.status = latest.status;
            }
        }

        if (approval.status === 'APPROVED') {
            context.pendingApprovalRequest = undefined;
            return new ExecutingState();
        }

        if (approval.status === 'REJECTED') {
            context.pendingApprovalRequest = undefined;
            return new FailedState(
                new Error(`Tool execution for '${approval.toolName}' was rejected by human approval decision.`)
            );
        }

        // Still pending - stay in AwaitingApprovalState
        return this;
    }
}

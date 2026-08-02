import type { ApprovalRequest } from './types.js';

export class ApprovalGate {
    private requests = new Map<string, ApprovalRequest>();

    public createRequest(
        toolName: string,
        args: Record<string, unknown>,
        reason: string
    ): ApprovalRequest {
        const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const request: ApprovalRequest = {
            id,
            toolName,
            args,
            reason,
            status: 'PENDING',
            requestedAt: new Date(),
        };

        this.requests.set(id, request);
        return request;
    }

    public getPendingRequests(): ApprovalRequest[] {
        return Array.from(this.requests.values()).filter((r) => r.status === 'PENDING');
    }

    public getRequest(id: string): ApprovalRequest | undefined {
        return this.requests.get(id);
    }

    public resolveRequest(id: string, approved: boolean): boolean {
        const request = this.requests.get(id);
        if (!request || request.status !== 'PENDING') {
            return false;
        }

        request.status = approved ? 'APPROVED' : 'REJECTED';
        return true;
    }
}

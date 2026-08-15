import type { ApprovalRequest, ApprovalStore } from './types.js';

export class MemoryApprovalStore implements ApprovalStore {
    private requests = new Map<string, ApprovalRequest>();

    public async save(request: ApprovalRequest): Promise<void> {
        this.requests.set(request.id, request);
    }

    public async get(id: string): Promise<ApprovalRequest | undefined> {
        return this.requests.get(id);
    }

    public async getPending(): Promise<ApprovalRequest[]> {
        return Array.from(this.requests.values()).filter((r) => r.status === 'PENDING');
    }

    public async update(id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> {
        const request = this.requests.get(id);
        if (!request || request.status !== 'PENDING') {
            return false;
        }
        request.status = status;
        return true;
    }
}

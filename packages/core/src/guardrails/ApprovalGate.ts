import type { ApprovalRequest, ApprovalStore } from './types.js';
import { MemoryApprovalStore } from './MemoryApprovalStore.js';

export class ApprovalGate {
    private store: ApprovalStore;

    constructor(store?: ApprovalStore) {
        this.store = store ?? new MemoryApprovalStore();
    }

    public async createRequest(
        toolName: string,
        args: Record<string, unknown>,
        reason: string
    ): Promise<ApprovalRequest> {
        const id = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const request: ApprovalRequest = {
            id,
            toolName,
            args,
            reason,
            status: 'PENDING',
            requestedAt: new Date(),
        };

        await this.store.save(request);
        return request;
    }

    public async getPendingRequests(): Promise<ApprovalRequest[]> {
        return this.store.getPending();
    }

    public async getRequest(id: string): Promise<ApprovalRequest | undefined> {
        return this.store.get(id);
    }

    public async resolveRequest(id: string, approved: boolean): Promise<boolean> {
        return this.store.update(id, approved ? 'APPROVED' : 'REJECTED');
    }
}

import { AgentState } from './State.js';
import type { RunContext, RunStatus } from '../types.js';

export class FailedState extends AgentState {
    public readonly status: RunStatus = 'FAILED';

    constructor(public readonly error: Error) {
        super();
    }

    public async execute(context: RunContext): Promise<AgentState> {
        context.error = this.error;
        // Terminal state - no transition
        return this;
    }
}

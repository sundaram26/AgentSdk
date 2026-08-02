import { AgentState } from './State.js';
import type { RunContext, RunStatus } from '../types.js';

export class DoneState extends AgentState {
    public readonly status: RunStatus = 'DONE';

    public async execute(context: RunContext): Promise<AgentState> {
        // Terminal state - no transition
        return this;
    }
}

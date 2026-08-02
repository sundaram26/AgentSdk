import type { RunContext, RunStatus } from '../types.js';

export abstract class AgentState {
    public abstract readonly status: RunStatus;

    public abstract execute(context: RunContext): Promise<AgentState>;
}

import type { RunStatus } from '../types.js';
import type { AgentState } from './State.js';
import { PlanningState } from './PlanningState.js';
import { ExecutingState } from './ExecutingState.js';
import { VerifyingState } from './VerifyingState.js';
import { DoneState } from './DoneState.js';
import { FailedState } from './FailedState.js';

/**
 * Factory that maps RunStatus keys to AgentState constructors.
 * Developers can override any state or inject custom states by providing
 * their own StateFactory to AgentBuilder.stateFactory().
 */
export class StateFactory {
    private readonly overrides: Partial<Record<RunStatus, () => AgentState>>;

    constructor(overrides?: Partial<Record<RunStatus, () => AgentState>>) {
        this.overrides = overrides ?? {};
    }

    public create(status: RunStatus, ...args: unknown[]): AgentState {
        const override = this.overrides[status];
        if (override) return override();

        // Built-in default state implementations
        switch (status) {
            case 'PLANNING':    return new PlanningState();
            case 'EXECUTING':   return new ExecutingState();
            case 'VERIFYING':   return new VerifyingState(typeof args[0] === 'string' ? args[0] : '');
            case 'DONE':        return new DoneState();
            case 'FAILED':      return new FailedState(args[0] instanceof Error ? args[0] : new Error(String(args[0] ?? 'Unknown error')));
            case 'AWAITING_APPROVAL': return new PlanningState(); // resumed externally
            default:
                throw new Error(`StateFactory: no state registered for status '${status as string}'.`);
        }
    }

    /**
     * Creates a copy of this factory with an additional override.
     * Useful for chaining overrides without mutation.
     */
    public withOverride(status: RunStatus, factory: () => AgentState): StateFactory {
        return new StateFactory({ ...this.overrides, [status]: factory });
    }
}

/** Singleton default factory — used when the developer does not customize states. */
export const defaultStateFactory = new StateFactory();

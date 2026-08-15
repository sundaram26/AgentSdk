import { AgentState } from './states/State.js';
import { StateFactory, defaultStateFactory } from './states/StateFactory.js';
import type { RunContext, RunStatus } from './types.js';

export class RunStateMachine {
    private currentState: AgentState;
    private readonly factory: StateFactory;

    constructor(initialState?: AgentState, factory?: StateFactory) {
        this.factory = factory ?? defaultStateFactory;
        this.currentState = initialState ?? this.factory.create('PLANNING');
    }

    public get status(): RunStatus {
        return this.currentState.status;
    }

    public get isTerminal(): boolean {
        return this.status === 'DONE' || this.status === 'FAILED';
    }

    public async step(context: RunContext): Promise<AgentState> {
        if (this.isTerminal) {
            return this.currentState;
        }

        // Ensure every state has access to the factory via context
        context.stateFactory = context.stateFactory ?? this.factory;

        const prevStatus = this.status;
        const spanId = context.tracer?.startSpan(`state_${prevStatus}`, 'state', { from: prevStatus });

        const nextState = await this.currentState.execute(context);
        this.currentState = nextState;

        if (spanId && context.tracer) {
            context.tracer.endSpan(spanId, undefined, { to: this.status });
        }

        if (prevStatus !== this.status && context.eventEmitter) {
            context.eventEmitter.emitEvent({
                type: 'state_changed',
                payload: { from: prevStatus, to: this.status },
            });
        }

        // Execute terminal state logic once to populate context.error or context.lastOutput
        if (this.isTerminal) {
            await this.currentState.execute(context);
        }

        return this.currentState;
    }
}

import { EventEmitter } from 'events';
import type {
    SutraEvent,
    TextDeltaPayload,
    ToolStartedPayload,
    ToolCompletedPayload,
    GuardrailTriggeredPayload,
    StateChangedPayload,
    RunCompletedPayload,
    RunFailedPayload,
} from './types.js';

export class RunEventEmitter extends EventEmitter {
    private queue: SutraEvent[] = [];
    private resolvers: Array<(value: IteratorResult<SutraEvent>) => void> = [];
    private isDone = false;

    public emitEvent(event: SutraEvent): void {
        this.emit(event.type, event.payload);
        this.emit('event', event);

        if (event.type === 'run_completed' || event.type === 'run_failed') {
            this.isDone = true;
        }

        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift();
            if (resolve) {
                resolve({ value: event, done: false });
            }
        } else {
            this.queue.push(event);
        }

        if (this.isDone) {
            while (this.resolvers.length > 0) {
                const resolve = this.resolvers.shift();
                if (resolve) {
                    resolve({ value: undefined as unknown as SutraEvent, done: true });
                }
            }
        }
    }

    public onTextDelta(listener: (payload: TextDeltaPayload) => void): this {
        return this.on('text_delta', listener);
    }

    public onToolStarted(listener: (payload: ToolStartedPayload) => void): this {
        return this.on('tool_started', listener);
    }

    public onToolCompleted(listener: (payload: ToolCompletedPayload) => void): this {
        return this.on('tool_completed', listener);
    }

    public onGuardrailTriggered(listener: (payload: GuardrailTriggeredPayload) => void): this {
        return this.on('guardrail_triggered', listener);
    }

    public onStateChanged(listener: (payload: StateChangedPayload) => void): this {
        return this.on('state_changed', listener);
    }

    public onRunCompleted(listener: (payload: RunCompletedPayload) => void): this {
        return this.on('run_completed', listener);
    }

    public onRunFailed(listener: (payload: RunFailedPayload) => void): this {
        return this.on('run_failed', listener);
    }

    public toAsyncIterable(): AsyncIterable<SutraEvent> {
        return {
            [Symbol.asyncIterator]: () => {
                return {
                    next: (): Promise<IteratorResult<SutraEvent>> => {
                        if (this.queue.length > 0) {
                            const event = this.queue.shift()!;
                            return Promise.resolve({ value: event, done: false });
                        }

                        if (this.isDone) {
                            return Promise.resolve({ value: undefined as unknown as SutraEvent, done: true });
                        }

                        return new Promise<IteratorResult<SutraEvent>>((resolve) => {
                            this.resolvers.push(resolve);
                        });
                    },
                };
            },
        };
    }
}

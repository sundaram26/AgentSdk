import { EventEmitter } from 'events';
import type {
    AgentEvent,
    TextDeltaPayload,
    ToolStartedPayload,
    ToolCompletedPayload,
    GuardrailTriggeredPayload,
    StateChangedPayload,
    RunCompletedPayload,
    RunFailedPayload,
} from './types.js';

export interface EventEmitterOptions {
    /** Maximum number of unconsumed events buffered in memory. Defaults to 1000. */
    maxBufferSize?: number | undefined;
}

export class RunEventEmitter extends EventEmitter {
    private queue: AgentEvent[] = [];
    private resolvers: Array<(value: IteratorResult<AgentEvent>) => void> = [];
    private isDone = false;
    private dropped = 0;
    public readonly maxBufferSize: number;

    constructor(options?: EventEmitterOptions | number) {
        super();
        if (typeof options === 'number') {
            this.maxBufferSize = options > 0 ? options : 1000;
        } else {
            this.maxBufferSize = options?.maxBufferSize && options.maxBufferSize > 0 ? options.maxBufferSize : 1000;
        }
    }

    public emitEvent(event: AgentEvent): void {
        this.emit(event.type, event.payload);
        this.emit('event', event);

        if (event.type === 'run_completed' || event.type === 'run_failed') {
            this.isDone = true;
        }

        if (this.resolvers.length > 0) {
            // Consumer is already waiting — deliver immediately
            const resolve = this.resolvers.shift();
            if (resolve) {
                resolve({ value: event, done: false });
            }
        } else {
            // Buffer the event for later consumption; guard against unbounded growth using developer-configured buffer size
            if (this.queue.length < this.maxBufferSize) {
                this.queue.push(event);
            } else {
                this.dropped++;
            }
        }

        if (this.isDone) {
            // Flush all pending waiters
            while (this.resolvers.length > 0) {
                const resolve = this.resolvers.shift();
                if (resolve) {
                    resolve({ value: undefined as unknown as AgentEvent, done: true });
                }
            }
        }
    }

    /** Number of events dropped due to buffer overflow (developer observable). */
    public get droppedEventCount(): number {
        return this.dropped;
    }

    public destroy(): void {
        this.isDone = true;
        this.queue = [];
        this.dropped = 0;
        while (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift();
            if (resolve) {
                resolve({ value: undefined as unknown as AgentEvent, done: true });
            }
        }
        this.removeAllListeners();
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

    public toAsyncIterable(): AsyncIterable<AgentEvent> {
        return {
            [Symbol.asyncIterator]: () => {
                return {
                    next: (): Promise<IteratorResult<AgentEvent>> => {
                        // Drain buffered events first (preserves ordering)
                        if (this.queue.length > 0) {
                            const event = this.queue.shift()!;
                            return Promise.resolve({ value: event, done: false });
                        }

                        if (this.isDone) {
                            return Promise.resolve({ value: undefined as unknown as AgentEvent, done: true });
                        }

                        // Park the consumer — will be woken by emitEvent()
                        return new Promise<IteratorResult<AgentEvent>>((resolve) => {
                            this.resolvers.push(resolve);
                        });
                    },
                };
            },
        };
    }
}

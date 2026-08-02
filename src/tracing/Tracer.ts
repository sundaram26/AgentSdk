import type { Span, SpanType, Trace } from './types.js';
import type { RunStatus } from '../runtime/types.js';

export class Tracer {
    public readonly runId: string;
    private agentName?: string | undefined;
    private startTime: number;
    private endTime?: number | undefined;
    private status?: RunStatus | undefined;
    private spans: Span[] = [];
    private activeSpans = new Map<string, Span>();

    constructor(agentName?: string) {
        this.runId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.agentName = agentName;
        this.startTime = Date.now();
    }

    public startSpan(name: string, type: SpanType, data?: Record<string, unknown>): string {
        const id = `span_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const span: Span = {
            id,
            name,
            type,
            startTime: Date.now(),
            data,
        };

        this.spans.push(span);
        this.activeSpans.set(id, span);
        return id;
    }

    public endSpan(id: string, error?: Error, extraData?: Record<string, unknown>): void {
        const span = this.activeSpans.get(id);
        if (!span) return;

        span.endTime = Date.now();
        span.durationMs = span.endTime - span.startTime;
        if (error) {
            span.error = error;
        }
        if (extraData) {
            span.data = { ...(span.data || {}), ...extraData };
        }

        this.activeSpans.delete(id);
    }

    public endRun(status: RunStatus): Trace {
        this.status = status;
        this.endTime = Date.now();
        return this.getTrace();
    }

    public getTrace(): Trace {
        const durationMs = (this.endTime || Date.now()) - this.startTime;
        const spansCopy = [...this.spans];
        const runId = this.runId;
        const agentName = this.agentName;
        const startTime = this.startTime;
        const endTime = this.endTime;
        const status = this.status;

        return {
            runId,
            agentName,
            startTime,
            endTime,
            durationMs,
            status,
            spans: spansCopy,
            toJSON() {
                return {
                    runId,
                    agentName,
                    startTime: new Date(startTime).toISOString(),
                    endTime: endTime ? new Date(endTime).toISOString() : undefined,
                    durationMs,
                    status,
                    spans: spansCopy.map((s) => ({
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        startTime: new Date(s.startTime).toISOString(),
                        endTime: s.endTime ? new Date(s.endTime).toISOString() : undefined,
                        durationMs: s.durationMs,
                        data: s.data,
                        error: s.error ? s.error.message : undefined,
                    })),
                };
            },
        };
    }
}

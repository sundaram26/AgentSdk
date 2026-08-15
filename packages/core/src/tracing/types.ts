import type { RunStatus } from '../runtime/types.js';

export type SpanType = 'llm' | 'tool' | 'guardrail' | 'state';

export interface Span {
    id: string;
    name: string;
    type: SpanType;
    startTime: number;
    endTime?: number | undefined;
    durationMs?: number | undefined;
    data?: Record<string, unknown> | undefined;
    error?: Error | undefined;
}

export interface TraceData {
    runId: string;
    agentName?: string | undefined;
    startTime: number;
    endTime?: number | undefined;
    durationMs?: number | undefined;
    status?: RunStatus | undefined;
    totalTokens?: number | undefined;
    spans: Span[];
}

export interface Trace extends TraceData {
    toJSON(): Record<string, unknown>;
}

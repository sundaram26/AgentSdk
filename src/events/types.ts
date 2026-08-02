import type { RunStatus } from '../runtime/types.js';

export type SutraEventType =
    | 'text_delta'
    | 'tool_started'
    | 'tool_completed'
    | 'guardrail_triggered'
    | 'state_changed'
    | 'run_completed'
    | 'run_failed';

export interface TextDeltaPayload {
    delta: string;
}

export interface ToolStartedPayload {
    toolName: string;
    args: Record<string, unknown>;
}

export interface ToolCompletedPayload {
    toolName: string;
    result: unknown;
    durationMs: number;
    success: boolean;
}

export interface GuardrailTriggeredPayload {
    stage: string;
    ruleName: string;
    action: string;
    reason?: string | undefined;
}

export interface StateChangedPayload {
    from: RunStatus;
    to: RunStatus;
}

export interface RunCompletedPayload {
    output: string;
    turns: number;
}

export interface RunFailedPayload {
    error: Error;
}

export type SutraEvent =
    | { type: 'text_delta'; payload: TextDeltaPayload }
    | { type: 'tool_started'; payload: ToolStartedPayload }
    | { type: 'tool_completed'; payload: ToolCompletedPayload }
    | { type: 'guardrail_triggered'; payload: GuardrailTriggeredPayload }
    | { type: 'state_changed'; payload: StateChangedPayload }
    | { type: 'run_completed'; payload: RunCompletedPayload }
    | { type: 'run_failed'; payload: RunFailedPayload };

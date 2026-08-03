import type { AnyToolCommand } from '../tools/types.js';

export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
    role: Role;
    content: string;
    tool_call_id?: string | undefined;
    tool_calls?: ToolCallInfo[] | undefined;
}

export interface ToolCallInfo {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface LLMResponse {
    text: string;
    toolCalls?: ToolCallInfo[] | undefined;
}

export interface LLMOptions {
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    tools?: AnyToolCommand[] | undefined;
}

export interface AdapterOptions {
    apiKey?: string | undefined;
}

export interface FallbackAttempt {
    provider: string;
    error: Error;
}

export interface FallbackChainOptions {
    maxRetriesPerAdapter?: number | undefined;
    retryBackoffMs?: number | undefined;
    onFallback?: ((fromProvider: string, toProvider: string, error: Error) => void) | undefined;
}

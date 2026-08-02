export type Role = 'user' | 'assistant' | 'system';

export interface Message {
    role: Role;
    content: string;
}

export interface LLMResponse {
    text: string;
}

export interface LLMOptions {
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
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

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

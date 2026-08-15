import type { Message, LLMOptions, LLMResponse } from './types.js';

export interface LLMPort {
    readonly providerName: string;

    generate(messages: Message[], options: LLMOptions): Promise<LLMResponse>;
    stream(messages: Message[], options: LLMOptions): AsyncIterable<string>;
}

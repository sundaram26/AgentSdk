import OpenAI from 'openai';
import type { LLMPort } from '../LLMPort.js';
import type { Message, LLMOptions, LLMResponse } from '../types.js';

export class OpenAIAdapter implements LLMPort {
    public readonly providerName = 'openai';
    private client: OpenAI;

    constructor(apiKey?: string) {
        this.client = new OpenAI({ apiKey });
    }

    private formatMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
        return messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
    }

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
            model: options.model,
            messages: this.formatMessages(messages),
        };
        if (options.temperature !== undefined) params.temperature = options.temperature;
        if (options.maxTokens !== undefined) params.max_tokens = options.maxTokens;

        const response = await this.client.chat.completions.create(params);

        const text = response.choices[0]?.message?.content || '';
        return { text };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
            model: options.model,
            messages: this.formatMessages(messages),
            stream: true,
        };
        if (options.temperature !== undefined) params.temperature = options.temperature;
        if (options.maxTokens !== undefined) params.max_tokens = options.maxTokens;

        const stream = await this.client.chat.completions.create(params);

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }
}

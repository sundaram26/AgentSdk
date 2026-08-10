import type OpenAI from 'openai';
import type { LLMPort } from '../LLMPort.js';
import type { Message, LLMOptions, LLMResponse, AdapterOptions, ToolCallInfo } from '../types.js';

export class OpenAIAdapter implements LLMPort {
    public readonly providerName = 'openai';
    private clientPromise: Promise<OpenAI>;

    constructor(options?: AdapterOptions | string) {
        const apiKey = typeof options === 'string' ? options : options?.apiKey;
        this.clientPromise = import('openai').then(mod => new mod.default({ apiKey }));
    }

    private formatMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
        return messages.map((m) => {
            if (m.role === 'tool') {
                return {
                    role: 'tool',
                    tool_call_id: m.tool_call_id || '',
                    content: m.content,
                } as OpenAI.Chat.ChatCompletionToolMessageParam;
            } else if (m.role === 'assistant' && m.tool_calls) {
                return {
                    role: 'assistant',
                    content: m.content || null,
                    tool_calls: m.tool_calls.map((tc) => ({
                        id: tc.id,
                        type: 'function',
                        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
                    })),
                } as OpenAI.Chat.ChatCompletionAssistantMessageParam;
            }
            return {
                role: m.role as 'user' | 'system' | 'assistant',
                content: m.content,
            } as OpenAI.Chat.ChatCompletionMessageParam;
        });
    }

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
            model: options.model,
            messages: this.formatMessages(messages),
        };
        if (options.temperature !== undefined) params.temperature = options.temperature;
        if (options.maxTokens !== undefined) params.max_tokens = options.maxTokens;

        if (options.tools && options.tools.length > 0) {
            params.tools = options.tools.map((t) => ({
                type: 'function' as const,
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: (t.inputSchema as unknown as { _def?: unknown })?._def ? (t.inputSchema as unknown as Record<string, unknown>) : {},
                },
            }));
        }

        const client = await this.clientPromise;
        const response = await client.chat.completions.create(params);
        const choice = response.choices[0];
        const message = choice?.message;

        const toolCalls: ToolCallInfo[] = [];
        if (message?.tool_calls && message.tool_calls.length > 0) {
            for (const tc of message.tool_calls) {
                if (tc.type === 'function') {
                    try {
                        const parsedArgs = JSON.parse(tc.function.arguments || '{}');
                        toolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            arguments: parsedArgs,
                        });
                    } catch {
                        // Safe fallback if argument parsing fails
                    }
                }
            }
        }

        return {
            text: message?.content || '',
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
            model: options.model,
            messages: this.formatMessages(messages),
            stream: true,
        };
        if (options.temperature !== undefined) params.temperature = options.temperature;
        if (options.maxTokens !== undefined) params.max_tokens = options.maxTokens;

        const client = await this.clientPromise;
        const stream = await client.chat.completions.create(params);

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }
}

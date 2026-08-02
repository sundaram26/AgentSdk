import Anthropic from '@anthropic-ai/sdk';
import type { LLMPort } from '../LLMPort.js';
import type { Message, LLMOptions, LLMResponse, AdapterOptions, ToolCallInfo } from '../types.js';

export class ClaudeAdapter implements LLMPort {
    public readonly providerName = 'claude';
    private client: Anthropic;

    constructor(options?: AdapterOptions | string) {
        const apiKey = typeof options === 'string' ? options : options?.apiKey;
        this.client = new Anthropic({ apiKey });
    }

    private formatMessages(messages: Message[]): { system?: string; messages: Anthropic.MessageParam[] } {
        const systemMessage = messages.find(m => m.role === 'system')?.content;
        const chatMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }));

        const result: { system?: string; messages: Anthropic.MessageParam[] } = { messages: chatMessages };
        if (systemMessage !== undefined) {
            result.system = systemMessage;
        }
        return result;
    }

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const { system, messages: chatMessages } = this.formatMessages(messages);

        const params: Anthropic.MessageCreateParamsNonStreaming = {
            model: options.model,
            messages: chatMessages,
            max_tokens: options.maxTokens ?? 4096,
        };
        if (system !== undefined) params.system = system;
        if (options.temperature !== undefined) params.temperature = options.temperature;

        if (options.tools && options.tools.length > 0) {
            params.tools = options.tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: (t.inputSchema as unknown as Anthropic.Tool.InputSchema) || { type: 'object', properties: {} },
            }));
        }

        const response = await this.client.messages.create(params);

        let text = '';
        const toolCalls: ToolCallInfo[] = [];

        for (const block of response.content) {
            if (block.type === 'text') {
                text += block.text;
            } else if (block.type === 'tool_use') {
                toolCalls.push({
                    id: block.id,
                    name: block.name,
                    arguments: (typeof block.input === 'object' && block.input !== null) ? (block.input as Record<string, unknown>) : {},
                });
            }
        }

        return {
            text,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const { system, messages: chatMessages } = this.formatMessages(messages);

        const params: Anthropic.MessageCreateParamsStreaming = {
            model: options.model,
            messages: chatMessages,
            max_tokens: options.maxTokens ?? 1024,
            stream: true,
        };
        if (system !== undefined) params.system = system;
        if (options.temperature !== undefined) params.temperature = options.temperature;

        const stream = await this.client.messages.create(params);

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield event.delta.text;
            }
        }
    }
}

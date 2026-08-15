import type { GoogleGenerativeAI, ModelParams, GenerationConfig, GenerateContentRequest, Content, FunctionDeclaration } from '@google/generative-ai';
import type { LLMPort } from '../LLMPort.js';
import type { Message, LLMOptions, LLMResponse, AdapterOptions, ToolCallInfo } from '../types.js';

export class GeminiAdapter implements LLMPort {
    public readonly providerName = 'gemini';
    private clientPromise: Promise<GoogleGenerativeAI>;

    constructor(options?: AdapterOptions | string) {
        const apiKey = typeof options === 'string' ? options : options?.apiKey;
        this.clientPromise = import('@google/generative-ai').then(mod => new mod.GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || ''));
    }

    private formatMessages(messages: Message[]): { systemInstruction?: string; contents: Content[] } {
        const systemMessage = messages.find(m => m.role === 'system')?.content;
        const chatMessages: Content[] = [];
        for (const m of messages) {
            if (m.role === 'system') continue;

            if (m.role === 'tool') {
                let responseObj = {};
                try {
                    responseObj = JSON.parse(m.content);
                } catch {
                    responseObj = { error: m.content };
                }
                chatMessages.push({
                    role: 'function' as const,
                    parts: [
                        {
                            functionResponse: {
                                name: m.tool_call_id || 'unknown_tool',
                                response: responseObj,
                            },
                        } as any,
                    ],
                });
            } else if (m.role === 'assistant') {
                const parts: any[] = [];
                if (m.content) {
                    parts.push({ text: m.content });
                }
                if (m.tool_calls) {
                    for (const tc of m.tool_calls) {
                        parts.push({
                            functionCall: {
                                name: tc.name,
                                args: tc.arguments,
                            },
                        });
                    }
                }
                chatMessages.push({
                    role: 'model' as const,
                    parts: parts.length > 0 ? parts : [{ text: m.content }],
                });
            } else {
                chatMessages.push({
                    role: 'user' as const,
                    parts: [{ text: m.content }],
                });
            }
        }

        const result: { systemInstruction?: string; contents: Content[] } = { contents: chatMessages };
        if (systemMessage !== undefined) {
            result.systemInstruction = systemMessage;
        }
        return result;
    }

    async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const { systemInstruction, contents } = this.formatMessages(messages);
        
        const modelParams: ModelParams = { model: options.model };
        if (systemInstruction !== undefined) modelParams.systemInstruction = systemInstruction;

        if (options.tools && options.tools.length > 0) {
            modelParams.tools = [{
                functionDeclarations: options.tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: (t.inputSchema as unknown as Record<string, unknown>) || {},
                })) as unknown as FunctionDeclaration[],
            }];
        }

        const client = await this.clientPromise;
        const model = client.getGenerativeModel(modelParams);

        const generationConfig: GenerationConfig = {};
        if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
        if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

        const request: GenerateContentRequest = { contents };
        if (Object.keys(generationConfig).length > 0) {
            request.generationConfig = generationConfig;
        }

        const result = await model.generateContent(request);
        const responseObj = result.response;

        const toolCalls: ToolCallInfo[] = [];
        const candidates = responseObj.candidates;

        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.functionCall) {
                    toolCalls.push({
                        id: `gemini_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        name: part.functionCall.name,
                        arguments: (part.functionCall.args as Record<string, unknown>) || {},
                    });
                }
            }
        }

        let text = '';
        try {
            text = responseObj.text();
        } catch {
            // Text may be empty if response only contains function calls
        }

        return {
            text,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const { systemInstruction, contents } = this.formatMessages(messages);

        const modelParams: ModelParams = { model: options.model };
        if (systemInstruction !== undefined) modelParams.systemInstruction = systemInstruction;
        const client = await this.clientPromise;
        const model = client.getGenerativeModel(modelParams);

        const generationConfig: GenerationConfig = {};
        if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
        if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

        const request: GenerateContentRequest = { contents };
        if (Object.keys(generationConfig).length > 0) {
            request.generationConfig = generationConfig;
        }

        const result = await model.generateContentStream(request);

        for await (const chunk of result.stream) {
            let chunkText = '';
            try {
                chunkText = chunk.text();
            } catch {
                // Ignore functionCall chunks in text streaming
            }
            if (chunkText) {
                yield chunkText;
            }
        }
    }
}

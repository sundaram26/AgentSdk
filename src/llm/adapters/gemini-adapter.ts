import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ModelParams, GenerationConfig, GenerateContentRequest, Content } from '@google/generative-ai';
import type { LLMPort } from '../LLMPort.js';
import type { Message, LLMOptions, LLMResponse } from '../types.js';

export class GeminiAdapter implements LLMPort {
    public readonly providerName = 'gemini';
    private client: GoogleGenerativeAI;

    constructor(apiKey?: string) {
        this.client = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || '');
    }

    private formatMessages(messages: Message[]): { systemInstruction?: string; contents: Content[] } {
        const systemMessage = messages.find(m => m.role === 'system')?.content;
        const chatMessages: Content[] = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

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
        const model = this.client.getGenerativeModel(modelParams);

        const generationConfig: GenerationConfig = {};
        if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
        if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

        const request: GenerateContentRequest = { contents };
        if (Object.keys(generationConfig).length > 0) {
            request.generationConfig = generationConfig;
        }

        const result = await model.generateContent(request);

        const text = result.response.text();
        return { text };
    }

    async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const { systemInstruction, contents } = this.formatMessages(messages);

        const modelParams: ModelParams = { model: options.model };
        if (systemInstruction !== undefined) modelParams.systemInstruction = systemInstruction;
        const model = this.client.getGenerativeModel(modelParams);

        const generationConfig: GenerationConfig = {};
        if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
        if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

        const request: GenerateContentRequest = { contents };
        if (Object.keys(generationConfig).length > 0) {
            request.generationConfig = generationConfig;
        }

        const result = await model.generateContentStream(request);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                yield chunkText;
            }
        }
    }
}

import type { LLMPort } from './LLMPort.js';
import type { Message, LLMOptions, LLMResponse, FallbackAttempt, FallbackChainOptions } from './types.js';
import { LLMFallbackError } from './LLMFallbackError.js';

export class FallbackChain implements LLMPort {
    public readonly providerName: string;
    private adapters: LLMPort[];
    private maxRetriesPerAdapter: number;
    private retryBackoffMs: number;
    private onFallback?: ((fromProvider: string, toProvider: string, error: Error) => void) | undefined;

    constructor(adapters: LLMPort[], options?: FallbackChainOptions) {
        if (!adapters || adapters.length === 0) {
            throw new Error('FallbackChain requires at least one LLMPort adapter.');
        }
        this.adapters = adapters;
        this.maxRetriesPerAdapter = options?.maxRetriesPerAdapter ?? 1;
        this.retryBackoffMs = options?.retryBackoffMs ?? 0;
        this.onFallback = options?.onFallback;
        this.providerName = `fallback-chain[${adapters.map((a) => a.providerName).join(', ')}]`;
    }

    public async generate(messages: Message[], options: LLMOptions): Promise<LLMResponse> {
        const attempts: FallbackAttempt[] = [];

        for (let i = 0; i < this.adapters.length; i++) {
            const adapter = this.adapters[i];
            if (!adapter) continue;

            for (let attempt = 0; attempt < this.maxRetriesPerAdapter; attempt++) {
                try {
                    return await adapter.generate(messages, options);
                } catch (err) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    attempts.push({ provider: adapter.providerName, error });

                    if (attempt < this.maxRetriesPerAdapter - 1 && this.retryBackoffMs > 0) {
                        await new Promise((res) => setTimeout(res, this.retryBackoffMs * (attempt + 1)));
                    }
                }
            }

            const nextAdapter = this.adapters[i + 1];
            const lastError = attempts[attempts.length - 1]?.error || new Error('Unknown adapter error');
            if (nextAdapter && this.onFallback) {
                this.onFallback(adapter.providerName, nextAdapter.providerName, lastError);
            }
        }

        throw new LLMFallbackError(attempts);
    }

    public async *stream(messages: Message[], options: LLMOptions): AsyncIterable<string> {
        const attempts: FallbackAttempt[] = [];

        for (let i = 0; i < this.adapters.length; i++) {
            const adapter = this.adapters[i];
            if (!adapter) continue;

            for (let attempt = 0; attempt < this.maxRetriesPerAdapter; attempt++) {
                try {
                    let emitted = false;
                    const iterator = adapter.stream(messages, options);

                    for await (const chunk of iterator) {
                        emitted = true;
                        yield chunk;
                    }

                    if (emitted) {
                        return;
                    }
                } catch (err) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    attempts.push({ provider: adapter.providerName, error });

                    if (attempt < this.maxRetriesPerAdapter - 1 && this.retryBackoffMs > 0) {
                        await new Promise((res) => setTimeout(res, this.retryBackoffMs * (attempt + 1)));
                    }
                }
            }

            const nextAdapter = this.adapters[i + 1];
            const lastError = attempts[attempts.length - 1]?.error || new Error('Unknown adapter error');
            if (nextAdapter && this.onFallback) {
                this.onFallback(adapter.providerName, nextAdapter.providerName, lastError);
            }
        }

        throw new LLMFallbackError(attempts);
    }
}

import type { FallbackAttempt } from './types.js';

export class LLMFallbackError extends Error {
    public readonly attempts: FallbackAttempt[];

    constructor(attempts: FallbackAttempt[]) {
        const details = attempts
            .map((a) => `[${a.provider}]: ${a.error.message}`)
            .join('; ');
        super(`All LLM providers in the fallback chain failed: ${details}`);
        this.name = 'LLMFallbackError';
        this.attempts = attempts;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LLMFallbackError);
        }
    }
}

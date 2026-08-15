import type { ZodIssue } from 'zod';

export class StructuredOutputError extends Error {
    public readonly code = 'STRUCTURED_OUTPUT_INVALID';

    constructor(
        public readonly rawOutput: string,
        public readonly issues?: ZodIssue[] | undefined
    ) {
        const issueSummary = issues
            ? issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
            : 'Invalid JSON schema structure';
        super(`Structured output validation failed: ${issueSummary}`);
        this.name = 'StructuredOutputError';
    }
}

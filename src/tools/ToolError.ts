import type { z, ZodError } from 'zod';

export abstract class ToolError extends Error {
    public abstract readonly code: string;

    constructor(
        message: string,
        public readonly toolName: string
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends ToolError {
    public readonly code = 'VALIDATION_ERROR';

    constructor(
        toolName: string,
        public readonly zodError: ZodError
    ) {
        const issuesSummary = zodError.issues
            .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        super(`Validation failed for tool '${toolName}': ${issuesSummary}`, toolName);
    }
}

export class ExecutionError extends ToolError {
    public readonly code = 'EXECUTION_ERROR';

    constructor(
        toolName: string,
        public readonly cause: unknown
    ) {
        const causeMessage = cause instanceof Error ? cause.message : String(cause);
        super(`Tool execution failed for '${toolName}': ${causeMessage}`, toolName);
    }
}

export class TimeoutError extends ToolError {
    public readonly code = 'TIMEOUT_ERROR';

    constructor(
        toolName: string,
        public readonly timeoutMs: number
    ) {
        super(`Tool '${toolName}' timed out after ${timeoutMs}ms`, toolName);
    }
}

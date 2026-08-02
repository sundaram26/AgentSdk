import type { z, ZodTypeAny, ZodIssue } from 'zod';

export interface StructuredValidationResult<T = unknown> {
    success: boolean;
    data?: T | undefined;
    error?: string | undefined;
    formattedPrompt?: string | undefined;
    issues?: ZodIssue[] | undefined;
}

export type AnyZodSchema = ZodTypeAny;

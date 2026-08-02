import type { ZodTypeAny, output as ZodOutput } from 'zod';
import type { ToolError } from './ToolError.js';

export interface ToolConfig<TSchema extends ZodTypeAny = ZodTypeAny, TOutput = unknown> {
    name: string;
    description: string;
    inputSchema: TSchema;
    execute: (input: ZodOutput<TSchema>) => Promise<TOutput>;
}

export interface ToolCommand<TInput = unknown, TOutput = unknown> {
    name: string;
    description: string;
    inputSchema: ZodTypeAny;
    execute: (input: TInput) => Promise<TOutput>;
}

export type AnyToolCommand = ToolCommand<never, unknown>;

export interface ToolExecutionSuccess<T = unknown> {
    success: true;
    result: T;
}

export interface ToolExecutionFailure {
    success: false;
    error: ToolError;
}

export type ToolExecutionResult<T = unknown> = ToolExecutionSuccess<T> | ToolExecutionFailure;

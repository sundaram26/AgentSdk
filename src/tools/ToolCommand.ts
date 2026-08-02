import type { ZodTypeAny, output as ZodOutput } from 'zod';
import type { ToolCommand, ToolConfig } from './types.js';

export function createTool<TSchema extends ZodTypeAny, TOutput>(
    config: ToolConfig<TSchema, TOutput>
): ToolCommand<ZodOutput<TSchema>, TOutput> {
    return {
        name: config.name,
        description: config.description,
        inputSchema: config.inputSchema,
        execute: config.execute,
    };
}

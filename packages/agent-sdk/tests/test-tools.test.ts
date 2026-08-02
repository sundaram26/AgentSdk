import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createTool, ToolRegistry, ValidationError, ExecutionError } from '../src/index.js';

describe('ToolCommand & ToolRegistry Unit Tests', () => {
    const addTool = createTool({
        name: 'add',
        description: 'Adds two numbers together',
        inputSchema: z.object({ a: z.number(), b: z.number() }),
        execute: async ({ a, b }: { a: number; b: number }) => ({ sum: a + b }),
    });

    const divideTool = createTool({
        name: 'divide',
        description: 'Divides a by b',
        inputSchema: z.object({ a: z.number(), b: z.number() }),
        execute: async ({ a, b }: { a: number; b: number }) => {
            if (b === 0) throw new Error('Division by zero is not allowed');
            return { quotient: a / b };
        },
    });

    it('should register tools and list them accurately', () => {
        const registry = new ToolRegistry();
        registry.register(addTool);
        registry.register(divideTool);

        expect(registry.has('add')).toBe(true);
        expect(registry.has('divide')).toBe(true);
        expect(registry.has('non_existent')).toBe(false);
        expect(registry.getAll().map((t) => t.name)).toEqual(['add', 'divide']);
    });

    it('should execute valid tools and return success results', async () => {
        const registry = new ToolRegistry();
        registry.register(addTool);

        const res = await registry.executeTool('add', { a: 5, b: 10 });
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.result).toEqual({ sum: 15 });
        }
    });

    it('should return ValidationError on invalid schema input', async () => {
        const registry = new ToolRegistry();
        registry.register(addTool);

        const res = await registry.executeTool('add', { a: 'invalid', b: 10 });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error).toBeInstanceOf(ValidationError);
            expect(res.error.message).toContain('Validation failed');
        }
    });

    it('should return ExecutionError on runtime tool exceptions', async () => {
        const registry = new ToolRegistry();
        registry.register(divideTool);

        const res = await registry.executeTool('divide', { a: 10, b: 0 });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error).toBeInstanceOf(ExecutionError);
            expect(res.error.message).toContain('Division by zero');
        }
    });
});

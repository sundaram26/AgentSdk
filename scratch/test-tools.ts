import { z } from 'zod';
import { createTool, ToolRegistry, ValidationError, ExecutionError } from '../src/tools/index.js';

// 1. Create a calculator tool
const addTool = createTool({
    name: 'add',
    description: 'Adds two numbers together',
    inputSchema: z.object({
        a: z.number(),
        b: z.number(),
    }),
    execute: async ({ a, b }) => {
        return { sum: a + b };
    },
});

// 2. Create a failing tool
const divideTool = createTool({
    name: 'divide',
    description: 'Divides a by b',
    inputSchema: z.object({
        a: z.number(),
        b: z.number(),
    }),
    execute: async ({ a, b }) => {
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        return { quotient: a / b };
    },
});

async function main() {
    const registry = new ToolRegistry();
    registry.register(addTool);
    registry.register(divideTool);

    console.log('Registered tools:', registry.getAll().map(t => t.name));

    // Test 1: Valid execution
    const res1 = await registry.executeTool('add', { a: 5, b: 10 });
    console.log('Test 1 (Valid Add):', res1);

    // Test 2: Invalid Schema Input
    const res2 = await registry.executeTool('add', { a: 'invalid', b: 10 });
    console.log('Test 2 (Schema Error):', res2.success === false && res2.error instanceof ValidationError ? 'PASSED (ValidationError)' : 'FAILED');

    // Test 3: Runtime Execution Error
    const res3 = await registry.executeTool('divide', { a: 10, b: 0 });
    console.log('Test 3 (Runtime Error):', res3.success === false && res3.error instanceof ExecutionError ? 'PASSED (ExecutionError)' : 'FAILED');
}

main().catch(console.error);

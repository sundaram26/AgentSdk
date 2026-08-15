import type { AnyToolCommand, ToolExecutionResult } from './types.js';
import { ToolError, ValidationError, ExecutionError, TimeoutError } from './ToolError.js';

export class ToolRegistry {
    private tools = new Map<string, AnyToolCommand>();

    public register(tool: AnyToolCommand): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool with name '${tool.name}' is already registered.`);
        }
        this.tools.set(tool.name, tool);
    }

    public get(name: string): AnyToolCommand | undefined {
        return this.tools.get(name);
    }

    public has(name: string): boolean {
        return this.tools.has(name);
    }

    public getAll(): AnyToolCommand[] {
        return Array.from(this.tools.values());
    }

    public async executeTool(
        name: string,
        rawInput: unknown,
        timeoutMs?: number
    ): Promise<ToolExecutionResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return {
                success: false,
                error: new ExecutionError(name, new Error(`Tool '${name}' not found in registry.`)),
            };
        }

        const parseResult = tool.inputSchema.safeParse(rawInput);
        if (!parseResult.success) {
            return {
                success: false,
                error: new ValidationError(name, parseResult.error),
            };
        }

        try {
            let result: unknown;
            if (timeoutMs !== undefined && timeoutMs > 0) {
                result = await this.executeWithTimeout(tool, parseResult.data, timeoutMs);
            } else {
                result = await tool.execute(parseResult.data as never);
            }

            return {
                success: true,
                result,
            };
        } catch (error) {
            if (error instanceof ToolError) {
                return { success: false, error };
            }
            return {
                success: false,
                error: new ExecutionError(name, error),
            };
        }
    }

    private executeWithTimeout(tool: AnyToolCommand, input: unknown, timeoutMs: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError(tool.name, timeoutMs));
            }, timeoutMs);

            Promise.resolve(tool.execute(input as never))
                .then((res) => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }
}

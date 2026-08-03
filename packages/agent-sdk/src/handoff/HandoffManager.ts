import { z } from 'zod';
import type { Agent } from '../agent/agent.js';
import type { AnyToolCommand } from '../tools/types.js';
import { createTool } from '../tools/ToolCommand.js';
import type { HandoffPayload, HandoffToolInput } from './types.js';
import { HANDOFF_TOOL_NAME } from './types.js';
import type { RunResult } from '../runtime/types.js';
import type { Message } from '../llm/types.js';

export class HandoffManager {
    private agents = new Map<string, Agent>();
    public maxHandoffDepth: number = 3;

    public setMaxHandoffDepth(depth: number): void {
        this.maxHandoffDepth = depth;
    }

    public registerAgent(name: string, agent: Agent): void {
        if (name === HANDOFF_TOOL_NAME) {
            throw new Error(
                `Cannot register a sub-agent with the reserved name '${HANDOFF_TOOL_NAME}'. ` +
                `This name is reserved for the internal handoff tool.`
            );
        }
        this.agents.set(name, agent);
    }

    public hasAgents(): boolean {
        return this.agents.size > 0;
    }

    public getRegisteredNames(): string[] {
        return Array.from(this.agents.keys());
    }

    public getAgent(name: string): Agent | undefined {
        return this.agents.get(name);
    }

    public getHandoffTool(currentDepth: number = 0): AnyToolCommand {
        const availableAgents = this.getRegisteredNames();
        const description = `Transfers the conversation execution to a specialized target agent. Available target agents: ${availableAgents.map((a) => `'${a}'`).join(', ')}`;

        return createTool({
            name: HANDOFF_TOOL_NAME,
            description,
            inputSchema: z.object({
                targetAgent: z.string().describe('Name of the target sub-agent to transfer execution to'),
                reason: z.string().describe('Reason for handoff'),
            }),
            execute: async (input: HandoffToolInput): Promise<RunResult> => {
                if (currentDepth >= this.maxHandoffDepth) {
                    throw new Error(
                        `Handoff failed: Maximum handoff depth of ${this.maxHandoffDepth} reached.`
                    );
                }

                const target = this.agents.get(input.targetAgent);
                if (!target) {
                    throw new Error(
                        `Handoff failed: Target agent '${input.targetAgent}' is not registered. Available agents: ${availableAgents.join(', ')}`
                    );
                }

                const prompt = `[Handoff from parent agent. Reason: ${input.reason}]`;
                return target.run(prompt);
            },
        });
    }

    public async executeHandoff(payload: HandoffPayload, history?: Message[], currentDepth: number = 0): Promise<RunResult> {
        if (currentDepth >= this.maxHandoffDepth) {
            throw new Error(`Handoff failed: Maximum handoff depth of ${this.maxHandoffDepth} reached.`);
        }

        const target = this.agents.get(payload.targetAgent);
        if (!target) {
            throw new Error(`Target agent '${payload.targetAgent}' not found in HandoffManager.`);
        }

        const prompt = `[Handoff Reason: ${payload.reason}]`;
        return target.run(prompt, history);
    }
}

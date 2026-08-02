import type { ZodTypeAny } from 'zod';
import { Agent } from './agent.js';
import type { LLMPort } from '../llm/LLMPort.js';
import { FallbackChain } from '../llm/FallbackChain.js';
import type { AnyToolCommand } from '../tools/types.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { GuardrailPipeline } from '../guardrails/GuardrailPipeline.js';
import { ApprovalGate } from '../guardrails/ApprovalGate.js';
import type { GuardrailRule, ToolCallPayload } from '../guardrails/types.js';
import { HandoffManager } from '../handoff/HandoffManager.js';
import type { MemoryStore, MemoryOptions } from '../memory/types.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { MemorySessionStore } from '../memory/MemorySessionStore.js';

export class AgentBuilder {
    public instructionsText?: string | undefined;
    public modelName: string = 'gpt-4o';
    public llmPort?: LLMPort | undefined;
    public toolRegistry: ToolRegistry = new ToolRegistry();
    public maxTurnsCount: number = 10;
    public maxReasksCount: number = 1;
    public temperatureValue?: number | undefined;
    public maxTokensValue?: number | undefined;

    // Structured Output
    public outputSchemaObject?: ZodTypeAny | undefined;
    public maxSchemaRetriesCount: number = 2;

    // Guardrail pipelines & Approval
    public inputPipeline: GuardrailPipeline<string> = new GuardrailPipeline<string>();
    public toolPipeline: GuardrailPipeline<ToolCallPayload> = new GuardrailPipeline<ToolCallPayload>();
    public outputPipeline: GuardrailPipeline<string> = new GuardrailPipeline<string>();
    public approvalGate: ApprovalGate = new ApprovalGate();

    // Multi-Agent Handoffs
    public handoffManager: HandoffManager = new HandoffManager();

    // Memory Engine
    public memoryManager: MemoryManager = new MemoryManager(new MemorySessionStore());

    public instructions(text: string): this {
        this.instructionsText = text;
        return this;
    }

    public model(modelName: string): this {
        this.modelName = modelName;
        return this;
    }

    public llm(llm: LLMPort | LLMPort[]): this {
        if (Array.isArray(llm)) {
            this.llmPort = new FallbackChain(llm);
        } else {
            this.llmPort = llm;
        }
        return this;
    }

    public tool(tool: AnyToolCommand): this {
        this.toolRegistry.register(tool);
        return this;
    }

    public subAgent(name: string, agent: Agent): this {
        this.handoffManager.registerAgent(name, agent);
        return this;
    }

    public memory(storeOrOptions: MemoryStore | MemoryOptions): this {
        this.memoryManager = new MemoryManager(storeOrOptions);
        return this;
    }

    public maxTurns(max: number): this {
        this.maxTurnsCount = max;
        return this;
    }

    public maxReasks(max: number): this {
        this.maxReasksCount = max;
        return this;
    }

    public temperature(temp: number): this {
        this.temperatureValue = temp;
        return this;
    }

    public maxTokens(tokens: number): this {
        this.maxTokensValue = tokens;
        return this;
    }

    public outputSchema<TSchema extends ZodTypeAny>(schema: TSchema): this {
        this.outputSchemaObject = schema;
        return this;
    }

    public maxSchemaRetries(max: number): this {
        this.maxSchemaRetriesCount = max;
        return this;
    }

    public inputGuardrail(rule: GuardrailRule<string>): this {
        this.inputPipeline.addRule(rule);
        return this;
    }

    public toolGuardrail(rule: GuardrailRule<ToolCallPayload>): this {
        this.toolPipeline.addRule(rule);
        return this;
    }

    public outputGuardrail(rule: GuardrailRule<string>): this {
        this.outputPipeline.addRule(rule);
        return this;
    }

    public build(): Agent {
        if (!this.llmPort) {
            throw new Error('Agent requires an LLMPort adapter (e.g. OpenAIAdapter, ClaudeAdapter, GeminiAdapter)');
        }

        // Automatically attach handoff_to_agent tool if sub-agents were registered
        if (this.handoffManager.hasAgents()) {
            this.toolRegistry.register(this.handoffManager.getHandoffTool());
        }

        return new Agent(this);
    }
}

export function createAgent(): AgentBuilder {
    return new AgentBuilder();
}
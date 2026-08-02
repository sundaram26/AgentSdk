import type { ZodTypeAny } from 'zod';
import { Agent } from './agent.js';
import type { LLMPort } from '../llm/LLMPort.js';
import { FallbackChain } from '../llm/FallbackChain.js';
import type { AnyToolCommand, ToolConfig } from '../tools/types.js';
import { createTool } from '../tools/ToolCommand.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { GuardrailPipeline } from '../guardrails/GuardrailPipeline.js';
import { ApprovalGate } from '../guardrails/ApprovalGate.js';
import type { GuardrailRule, ToolCallPayload } from '../guardrails/types.js';
import { HandoffManager } from '../handoff/HandoffManager.js';
import type { MemoryStore, MemoryOptions } from '../memory/types.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { MemorySessionStore } from '../memory/MemorySessionStore.js';
import { ContextPruner } from '../context/ContextPruner.js';
import { StateFactory } from '../runtime/states/StateFactory.js';
import type { RunStatus } from '../runtime/types.js';
import type { AgentEvent } from '../events/types.js';
import { getSdkName } from '../config.js';

export type LoggerFunction = (message: string) => void;

export class AgentBuilder {
    public sdkNameValue?: string | undefined;
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

    // Context Pruning & Token Budgeting
    public maxContextTokensValue?: number | undefined;
    public contextPrunerInstance?: ContextPruner | undefined;

    // Custom State Factory
    public stateFactoryInstance?: StateFactory | undefined;

    // Event Stream Queue Configuration
    public eventBufferLimitValue?: number | undefined;

    // Developer DX Extensions
    public debugLogger?: LoggerFunction | undefined;
    public globalEventHandlers: Array<(event: AgentEvent) => void> = [];

    /**
     * Set the custom branding name for your SDK.
     * Can also be set globally via .env using `SDK_NAME` or `AGENT_SDK_NAME`.
     */
    public name(sdkName: string): this {
        this.sdkNameValue = sdkName;
        return this;
    }

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

    /**
     * Register a tool with the agent. Accepts either a `ToolCommand` object
     * or a raw `ToolConfig` definition directly (calling `createTool` automatically).
     */
    public tool(toolOrConfig: AnyToolCommand | ToolConfig): this {
        if ('inputSchema' in toolOrConfig && 'execute' in toolOrConfig) {
            const command = ('name' in toolOrConfig && typeof (toolOrConfig as AnyToolCommand).name === 'string')
                ? (toolOrConfig as AnyToolCommand)
                : createTool(toolOrConfig as ToolConfig);
            this.toolRegistry.register(command);
        }
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

    public maxContextTokens(tokens: number): this {
        this.maxContextTokensValue = tokens;
        return this;
    }

    public contextPruner(pruner: ContextPruner): this {
        this.contextPrunerInstance = pruner;
        return this;
    }

    /**
     * Enable built-in visual debug logging or supply a custom logging function.
     * Logs state transitions, tool execution details, guardrail triggers, and completions.
     * Uses your configured SDK name from `.env` or `.name()`.
     *
     * @example
     * agent.debug(true); // Logs formatted output to console.log
     * agent.debug((msg) => myLogger.info(msg)); // Custom logger
     */
    public debug(enabledOrLogger: boolean | LoggerFunction): this {
        if (typeof enabledOrLogger === 'function') {
            this.debugLogger = enabledOrLogger;
        } else if (enabledOrLogger) {
            const resolvedName = getSdkName(this.sdkNameValue);
            this.debugLogger = (msg: string) => console.log(`[${resolvedName} Debug] ${msg}`);
        } else {
            this.debugLogger = undefined;
        }
        return this;
    }

    /**
     * Register a global event listener that triggers on every event produced during agent runs.
     */
    public onEvent(handler: (event: AgentEvent) => void): this {
        this.globalEventHandlers.push(handler);
        return this;
    }

    /**
     * Override one or more built-in states, or inject entirely new states.
     * Accepts a partial map of RunStatus → factory function.
     */
    public stateFactory(overrides: Partial<Record<RunStatus, () => import('../runtime/states/State.js').AgentState>>): this {
        this.stateFactoryInstance = new StateFactory(overrides);
        return this;
    }

    /**
     * Set the maximum buffer size for unconsumed events in the async event stream queue.
     * Prevents memory leaks under high throughput. Defaults to 1000.
     */
    public eventBufferLimit(limit: number): this {
        this.eventBufferLimitValue = limit;
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
import type { ZodTypeAny } from 'zod';
import type { LLMPort } from '../llm/LLMPort.js';
import type { Message } from '../llm/types.js';
import type { ToolRegistry } from '../tools/ToolRegistry.js';
import type { GuardrailPipeline } from '../guardrails/GuardrailPipeline.js';
import type { ApprovalGate } from '../guardrails/ApprovalGate.js';
import type { GuardrailReport, ApprovalRequest, ToolCallPayload } from '../guardrails/types.js';
import type { RunEventEmitter } from '../events/RunEventEmitter.js';
import type { Tracer } from '../tracing/Tracer.js';
import type { Trace } from '../tracing/types.js';
import type { MemoryManager } from '../memory/MemoryManager.js';

export type RunStatus = 'PLANNING' | 'EXECUTING' | 'AWAITING_APPROVAL' | 'VERIFYING' | 'DONE' | 'FAILED';

export interface ToolCallInfo {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface RunContext {
    llm: LLMPort;
    tools: ToolRegistry;
    messages: Message[];
    systemInstruction?: string | undefined;
    currentTurn: number;
    maxTurns: number;
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    pendingToolCalls?: ToolCallInfo[] | undefined;
    lastOutput?: string | undefined;
    error?: Error | undefined;

    // Guardrail pipelines and approval gate
    inputPipeline?: GuardrailPipeline<string> | undefined;
    toolPipeline?: GuardrailPipeline<ToolCallPayload> | undefined;
    outputPipeline?: GuardrailPipeline<string> | undefined;
    approvalGate?: ApprovalGate | undefined;
    pendingApprovalRequest?: ApprovalRequest | undefined;
    guardrailReports?: GuardrailReport[] | undefined;
    reaskCount?: number | undefined;
    maxReasks?: number | undefined;

    // Structured Output Validation
    outputSchema?: ZodTypeAny | undefined;
    schemaRetryCount?: number | undefined;
    maxSchemaRetries?: number | undefined;
    structuredData?: unknown | undefined;

    // Events & Tracing
    eventEmitter?: RunEventEmitter | undefined;
    tracer?: Tracer | undefined;

    // Memory & Session
    sessionId?: string | undefined;
    memoryManager?: MemoryManager | undefined;
}

export interface RunOptions {
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    maxTurns?: number | undefined;
    systemInstruction?: string | undefined;

    // Guardrail pipelines
    inputPipeline?: GuardrailPipeline<string> | undefined;
    toolPipeline?: GuardrailPipeline<ToolCallPayload> | undefined;
    outputPipeline?: GuardrailPipeline<string> | undefined;
    approvalGate?: ApprovalGate | undefined;
    maxReasks?: number | undefined;

    // Structured Output options
    outputSchema?: ZodTypeAny | undefined;
    maxSchemaRetries?: number | undefined;

    // Events & Tracing options
    eventEmitter?: RunEventEmitter | undefined;
    tracer?: Tracer | undefined;

    // Memory options
    sessionId?: string | undefined;
    memoryManager?: MemoryManager | undefined;
}

export interface RunResult<TData = unknown> {
    success: boolean;
    status: RunStatus;
    output: string;
    turns: number;
    messages: Message[];
    error?: Error | undefined;
    pendingApproval?: ApprovalRequest | undefined;
    guardrailReports?: GuardrailReport[] | undefined;
    structuredData?: TData | undefined;
    trace?: Trace | undefined;
}

import type { LLMPort } from '../llm/LLMPort.js';

export type GuardrailAction = 'allow' | 'block' | 'fix' | 'reask' | 'pause';

export type GuardrailStage = 'input' | 'tool' | 'output';

export interface GuardrailEvaluation<T = unknown> {
    ruleName: string;
    passed: boolean;
    actionTaken: GuardrailAction;
    reason?: string | undefined;
    originalContent?: T | undefined;
    modifiedContent?: T | undefined;
}

export interface GuardrailReport {
    passed: boolean;
    durationMs: number;
    evaluations: GuardrailEvaluation[];
}

export interface GuardrailRule<T = unknown> {
    readonly name: string;
    readonly stage: GuardrailStage;
    readonly onFail: 'block' | 'fix' | 'reask' | 'pause';
    /** When true, GuardrailPipeline caches evaluation results keyed by rule name + serialized input. Opt-in for expensive LLM-backed rules. */
    readonly cacheable?: boolean | undefined;
    evaluate(target: T): Promise<GuardrailEvaluation<T>>;
}

export interface ApprovalRequest {
    id: string;
    toolName: string;
    args: Record<string, unknown>;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: Date;
}

// Rule Specific Types & Options

export interface PromptInjectionOptions {
    customPatterns?: RegExp[] | undefined;
}

export interface ToolCallPayload {
    toolName: string;
    args: Record<string, unknown>;
}

export interface ToolBoundaryOptions {
    restrictedTools?: string[] | undefined;
    requireApprovalTools?: string[] | undefined;
    onFail?: ('block' | 'pause') | undefined;
}

export type LLMEvaluatorFunction = (
    content: string
) => Promise<{ safe: boolean; reason?: string | undefined; fixedContent?: string | undefined }>;

export interface LLMClassifierOptions {
    name?: string | undefined;
    stage?: GuardrailStage | undefined;
    onFail?: ('block' | 'fix' | 'reask' | 'pause') | undefined;
    llm?: LLMPort | undefined;
    model?: string | undefined;
    evaluator?: LLMEvaluatorFunction | undefined;
    promptInstruction?: string | undefined;
}

export interface CompetitorMentionOptions {
    competitors: string[];
    onFail?: ('block' | 'fix' | 'reask' | 'pause') | undefined;
    replacement?: string | undefined;
}

export interface RegexRuleOptions {
    name?: string | undefined;
    pattern: RegExp;
    reason?: string | undefined;
    stage?: GuardrailStage | undefined;
    onFail?: ('block' | 'fix' | 'reask' | 'pause') | undefined;
    replacement?: string | undefined;
}

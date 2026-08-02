import type {
    GuardrailRule,
    GuardrailStage,
    GuardrailEvaluation,
    ToolCallPayload,
    ToolBoundaryOptions,
} from '../types.js';

export class ToolBoundaryRule implements GuardrailRule<ToolCallPayload> {
    public readonly name = 'ToolBoundaryRule';
    public readonly stage: GuardrailStage = 'tool';
    public readonly onFail: 'block' | 'pause';

    private restrictedTools: Set<string>;
    private requireApprovalTools: Set<string>;

    constructor(options?: ToolBoundaryOptions) {
        this.restrictedTools = new Set(options?.restrictedTools || []);
        this.requireApprovalTools = new Set(options?.requireApprovalTools || []);
        this.onFail = options?.onFail || 'block';
    }

    public async evaluate(target: ToolCallPayload): Promise<GuardrailEvaluation<ToolCallPayload>> {
        // 1. Check if tool is explicitly restricted
        if (this.restrictedTools.has(target.toolName)) {
            return {
                ruleName: this.name,
                passed: false,
                actionTaken: 'block',
                reason: `Tool '${target.toolName}' is blocked by restricted tool policy.`,
                originalContent: target,
            };
        }

        // 2. Check if tool requires human approval
        if (this.requireApprovalTools.has(target.toolName)) {
            return {
                ruleName: this.name,
                passed: false,
                actionTaken: 'pause',
                reason: `Tool '${target.toolName}' requires explicit human approval before execution.`,
                originalContent: target,
            };
        }

        // 3. Scan arguments for path traversal patterns
        const pathTraversalPattern = /(\.\.[\/\\])/;
        for (const [key, value] of Object.entries(target.args)) {
            if (typeof value === 'string' && pathTraversalPattern.test(value)) {
                return {
                    ruleName: this.name,
                    passed: false,
                    actionTaken: 'block',
                    reason: `Path traversal pattern ('../') detected in argument '${key}'.`,
                    originalContent: target,
                };
            }
        }

        return {
            ruleName: this.name,
            passed: true,
            actionTaken: 'allow',
            originalContent: target,
        };
    }
}

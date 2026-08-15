import type {
    GuardrailRule,
    GuardrailStage,
    GuardrailEvaluation,
    PromptInjectionOptions,
} from '../types.js';

export class PromptInjectionRule implements GuardrailRule<string> {
    public readonly name = 'PromptInjectionRule';
    public readonly stage: GuardrailStage = 'input';
    public readonly onFail: 'block' = 'block';

    private patterns: RegExp[] = [
        /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
        /system\s+override/i,
        /forget.*(system\s+)?prompt/i,
        /dan\s+mode/i,
        /uncensored\s*ai/i,
        /you\s+are\s+now\s+in\s+dan\s+mode/i,
        /jailbreak/i,
        /disregard\s+safety\s+guidelines/i,
    ];

    constructor(options?: PromptInjectionOptions | RegExp[]) {
        if (Array.isArray(options)) {
            this.patterns.push(...options);
        } else if (options?.customPatterns) {
            this.patterns.push(...options.customPatterns);
        }
    }

    public async evaluate(target: string): Promise<GuardrailEvaluation<string>> {
        for (const pattern of this.patterns) {
            if (pattern.test(target)) {
                return {
                    ruleName: this.name,
                    passed: false,
                    actionTaken: 'block',
                    reason: `Prompt injection pattern detected matching regex '${pattern.source}'`,
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

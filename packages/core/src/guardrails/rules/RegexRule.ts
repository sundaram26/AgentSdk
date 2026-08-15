import type { GuardrailRule, GuardrailStage, GuardrailEvaluation, RegexRuleOptions } from '../types.js';

export class RegexRule implements GuardrailRule<string> {
    public readonly name: string;
    public readonly stage: GuardrailStage;
    public readonly onFail: 'block' | 'fix' | 'reask' | 'pause';

    private pattern: RegExp;
    private reason: string;
    private replacement?: string | undefined;

    constructor(options: RegexRuleOptions) {
        this.name = options.name || 'RegexRule';
        this.pattern = options.pattern;
        this.reason = options.reason || `Content matched forbidden pattern ${options.pattern.source}`;
        this.stage = options.stage || 'output';
        this.onFail = options.onFail || 'block';
        this.replacement = options.replacement;
    }

    public async evaluate(target: string): Promise<GuardrailEvaluation<string>> {
        if (this.pattern.test(target)) {
            let modifiedContent: string | undefined;
            if (this.onFail === 'fix' && this.replacement !== undefined) {
                modifiedContent = target.replace(this.pattern, this.replacement);
            }

            return {
                ruleName: this.name,
                passed: false,
                actionTaken: this.onFail,
                reason: this.reason,
                originalContent: target,
                modifiedContent,
            };
        }

        return {
            ruleName: this.name,
            passed: true,
            actionTaken: 'allow',
            originalContent: target,
        };
    }
}

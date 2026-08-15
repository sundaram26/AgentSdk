import type { GuardrailRule, GuardrailStage, GuardrailEvaluation } from '../types.js';

export class PIIRedactionRule implements GuardrailRule<string> {
    public readonly name = 'PIIRedactionRule';
    public readonly stage: GuardrailStage = 'output';
    public readonly onFail: 'fix' = 'fix';

    private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    private phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    private ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    private creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;

    public async evaluate(target: string): Promise<GuardrailEvaluation<string>> {
        let modified = target;
        let piiFound = false;

        // Reset global regex indices before evaluation
        this.emailRegex.lastIndex = 0;
        this.phoneRegex.lastIndex = 0;
        this.ssnRegex.lastIndex = 0;
        this.creditCardRegex.lastIndex = 0;

        if (this.emailRegex.test(target)) {
            this.emailRegex.lastIndex = 0;
            modified = modified.replace(this.emailRegex, '[REDACTED EMAIL]');
            piiFound = true;
        }

        if (this.phoneRegex.test(target)) {
            this.phoneRegex.lastIndex = 0;
            modified = modified.replace(this.phoneRegex, '[REDACTED PHONE]');
            piiFound = true;
        }

        if (this.ssnRegex.test(target)) {
            this.ssnRegex.lastIndex = 0;
            modified = modified.replace(this.ssnRegex, '[REDACTED SSN]');
            piiFound = true;
        }

        if (this.creditCardRegex.test(target)) {
            this.creditCardRegex.lastIndex = 0;
            modified = modified.replace(this.creditCardRegex, '[REDACTED CREDIT CARD]');
            piiFound = true;
        }

        if (piiFound) {
            return {
                ruleName: this.name,
                passed: false,
                actionTaken: 'fix',
                reason: 'Sensitive PII detected and automatically redacted.',
                originalContent: target,
                modifiedContent: modified,
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

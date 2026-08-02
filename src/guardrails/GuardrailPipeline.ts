import type { GuardrailRule, GuardrailReport, GuardrailEvaluation } from './types.js';

export class GuardrailPipeline<T = unknown> {
    private rules: GuardrailRule<T>[] = [];

    public addRule(rule: GuardrailRule<T>): this {
        this.rules.push(rule);
        return this;
    }

    public getRules(): GuardrailRule<T>[] {
        return [...this.rules];
    }

    public async execute(target: T): Promise<{ content: T; report: GuardrailReport }> {
        const startTime = Date.now();
        const evaluations: GuardrailEvaluation<T>[] = [];
        let currentContent: T = target;
        let overallPassed = true;

        for (const rule of this.rules) {
            const evalResult = await rule.evaluate(currentContent);
            evaluations.push(evalResult);

            if (!evalResult.passed) {
                if (evalResult.actionTaken === 'fix' && evalResult.modifiedContent !== undefined) {
                    currentContent = evalResult.modifiedContent;
                } else if (evalResult.actionTaken === 'block' || evalResult.actionTaken === 'pause') {
                    overallPassed = false;
                    break;
                } else if (evalResult.actionTaken === 'reask') {
                    overallPassed = false;
                    break;
                }
            }
        }

        const durationMs = Date.now() - startTime;

        return {
            content: currentContent,
            report: {
                passed: overallPassed,
                durationMs,
                evaluations: evaluations as GuardrailEvaluation[],
            },
        };
    }
}

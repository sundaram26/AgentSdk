import type { GuardrailRule, GuardrailReport, GuardrailEvaluation } from './types.js';

export class GuardrailPipeline<T = unknown> {
    private rules: GuardrailRule<T>[] = [];
    // Cache keyed by serialized input — avoids re-evaluating expensive LLM rules on reask
    private readonly cache = new Map<string, GuardrailEvaluation<T>>();

    public addRule(rule: GuardrailRule<T>): this {
        this.rules.push(rule);
        return this;
    }

    public getRules(): GuardrailRule<T>[] {
        return [...this.rules];
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public async execute(target: T): Promise<{ content: T; report: GuardrailReport }> {
        const startTime = Date.now();
        const evaluations: GuardrailEvaluation<T>[] = [];
        let currentContent: T = target;
        let overallPassed = true;

        for (const rule of this.rules) {
            // Build cache key only when rule explicitly opts-in to caching
            const cacheKey = rule.cacheable
                ? `${rule.name}::${JSON.stringify(currentContent)}`
                : undefined;

            let evalResult: GuardrailEvaluation<T>;

            if (cacheKey && this.cache.has(cacheKey)) {
                evalResult = this.cache.get(cacheKey)!;
            } else {
                evalResult = await rule.evaluate(currentContent);
                if (cacheKey) {
                    this.cache.set(cacheKey, evalResult);
                }
            }

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

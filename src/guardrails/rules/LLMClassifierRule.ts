import type {
    GuardrailRule,
    GuardrailStage,
    GuardrailEvaluation,
    LLMClassifierOptions,
    LLMEvaluatorFunction,
} from '../types.js';
import type { LLMPort } from '../../llm/LLMPort.js';

export class LLMClassifierRule implements GuardrailRule<string> {
    public readonly name: string;
    public readonly stage: GuardrailStage;
    public readonly onFail: 'block' | 'fix' | 'reask' | 'pause';

    private llmPort?: LLMPort | undefined;
    private modelName: string;
    private customEvaluator?: LLMEvaluatorFunction | undefined;
    private promptInstruction: string;

    constructor(options: LLMClassifierOptions) {
        this.name = options.name || 'LLMClassifierRule';
        this.stage = options.stage || 'output';
        this.onFail = options.onFail || 'block';
        this.llmPort = options.llm;
        this.modelName = options.model || 'gpt-4o-mini';
        this.customEvaluator = options.evaluator;
        this.promptInstruction = options.promptInstruction || 
            'Evaluate if the content complies with safety policy (no toxicity, no severe bias, no hallucinations). Respond ONLY in JSON format: {"safe": boolean, "reason": "explanation if unsafe"}';
    }

    public async evaluate(target: string): Promise<GuardrailEvaluation<string>> {
        // 1. Use custom evaluator function if provided by developer
        if (this.customEvaluator) {
            const evalResult = await this.customEvaluator(target);
            if (!evalResult.safe) {
                return {
                    ruleName: this.name,
                    passed: false,
                    actionTaken: this.onFail,
                    reason: evalResult.reason || 'Content flagged as unsafe by custom evaluator.',
                    originalContent: target,
                    modifiedContent: evalResult.fixedContent,
                };
            }
            return {
                ruleName: this.name,
                passed: true,
                actionTaken: 'allow',
                originalContent: target,
            };
        }

        // 2. Use developer-supplied LLM adapter for classification
        if (!this.llmPort) {
            throw new Error(`LLMClassifierRule '${this.name}' requires either an LLMPort adapter or a custom evaluator function.`);
        }

        const messages = [
            {
                role: 'system' as const,
                content: this.promptInstruction,
            },
            {
                role: 'user' as const,
                content: target,
            },
        ];

        try {
            const response = await this.llmPort.generate(messages, {
                model: this.modelName,
                temperature: 0,
            });

            const jsonMatch = response.text.match(/```json\s*([\s\S]*?)\s*```/) || response.text.match(/(\{[\s\S]*"safe"[\s\S]*\})/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
            const parsed = JSON.parse(jsonStr.trim());

            if (parsed && parsed.safe === false) {
                return {
                    ruleName: this.name,
                    passed: false,
                    actionTaken: this.onFail,
                    reason: parsed.reason || 'Content flagged as unsafe by LLM classifier.',
                    originalContent: target,
                };
            }
        } catch {
            // Default to safe if JSON parsing fails
        }

        return {
            ruleName: this.name,
            passed: true,
            actionTaken: 'allow',
            originalContent: target,
        };
    }
}

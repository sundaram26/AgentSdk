import type {
    GuardrailRule,
    GuardrailStage,
    GuardrailEvaluation,
    CompetitorMentionOptions,
} from '../types.js';

export class CompetitorMentionRule implements GuardrailRule<string> {
    public readonly name = 'CompetitorMentionRule';
    public readonly stage: GuardrailStage = 'output';
    public readonly onFail: 'block' | 'fix' | 'reask' | 'pause';

    private competitors: string[];
    private replacement: string;

    constructor(options: CompetitorMentionOptions) {
        this.competitors = options.competitors;
        this.onFail = options.onFail || 'fix';
        this.replacement = options.replacement || '[REDACTED COMPETITOR]';
    }

    public async evaluate(target: string): Promise<GuardrailEvaluation<string>> {
        let modified = target;
        let foundCompetitor = false;
        let detectedBrand = '';

        for (const competitor of this.competitors) {
            const regex = new RegExp(`\\b${competitor}\\b`, 'gi');
            if (regex.test(modified)) {
                foundCompetitor = true;
                detectedBrand = competitor;
                modified = modified.replace(regex, this.replacement);
            }
        }

        if (foundCompetitor) {
            return {
                ruleName: this.name,
                passed: false,
                actionTaken: this.onFail,
                reason: `Mention of restricted competitor brand '${detectedBrand}' detected.`,
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

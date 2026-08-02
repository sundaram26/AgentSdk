import { AgentState } from './State.js';
import { DoneState } from './DoneState.js';
import { FailedState } from './FailedState.js';
import { PlanningState } from './PlanningState.js';
import { GuardrailError } from '../../guardrails/GuardrailError.js';
import { StructuredOutputValidator } from '../../structured/StructuredOutputValidator.js';
import { StructuredOutputError } from '../../structured/StructuredOutputError.js';
import type { RunContext, RunStatus } from '../types.js';

export class VerifyingState extends AgentState {
    public readonly status: RunStatus = 'VERIFYING';

    constructor(private readonly rawOutput: string) {
        super();
    }

    public async execute(context: RunContext): Promise<AgentState> {
        let finalOutput = this.rawOutput;

        // 1. Evaluate Output Guardrails
        if (context.outputPipeline) {
            const { content: sanitizedOutput, report } = await context.outputPipeline.execute(this.rawOutput);

            context.guardrailReports = context.guardrailReports || [];
            context.guardrailReports.push(report);

            if (!report.passed) {
                // Check if any rule requested a re-ask
                const reaskEval = report.evaluations.find((e) => e.actionTaken === 'reask');
                if (reaskEval) {
                    const currentReasks = context.reaskCount || 0;
                    const maxReasks = context.maxReasks ?? 1;

                    if (currentReasks < maxReasks) {
                        context.reaskCount = currentReasks + 1;
                        context.messages.push({
                            role: 'system',
                            content: `[Guardrail Correction Request]: Your previous response failed output guardrail '${reaskEval.ruleName}': ${reaskEval.reason || 'Invalid response'}. Please correct your output and try again.`,
                        });
                        return new PlanningState();
                    }

                    return new FailedState(
                        new GuardrailError(reaskEval.ruleName, `Max re-ask attempts (${maxReasks}) exceeded for rule '${reaskEval.ruleName}': ${reaskEval.reason}`)
                    );
                }

                // Check if any rule requested a block
                const blockEval = report.evaluations.find((e) => e.actionTaken === 'block');
                if (blockEval) {
                    return new FailedState(
                        new GuardrailError(blockEval.ruleName, blockEval.reason || 'Output blocked by guardrail policy')
                    );
                }
            }

            finalOutput = sanitizedOutput;
        }

        // 2. Evaluate Structured Output Validation (Zod Schema)
        if (context.outputSchema) {
            const validator = new StructuredOutputValidator(context.outputSchema);
            const valResult = validator.validate(finalOutput);

            if (!valResult.success) {
                const currentRetries = context.schemaRetryCount || 0;
                const maxRetries = context.maxSchemaRetries ?? 2;

                if (currentRetries < maxRetries) {
                    context.schemaRetryCount = currentRetries + 1;
                    context.messages.push({
                        role: 'system',
                        content: valResult.formattedPrompt || 'Output failed schema validation. Please format response strictly as valid JSON matching schema.',
                    });
                    return new PlanningState();
                }

                return new FailedState(
                    new StructuredOutputError(finalOutput, valResult.issues)
                );
            }

            // Structured validation succeeded - store parsed structuredData
            context.structuredData = valResult.data;
            context.lastOutput = typeof valResult.data === 'string' 
                ? valResult.data 
                : JSON.stringify(valResult.data, null, 2);

            return new DoneState();
        }

        // Store final verified plain output
        context.lastOutput = finalOutput;

        // Transition to DONE state
        return new DoneState();
    }
}

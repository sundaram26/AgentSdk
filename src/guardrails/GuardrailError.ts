export class GuardrailError extends Error {
    public readonly code = 'GUARDRAIL_BLOCKED';

    constructor(
        public readonly ruleName: string,
        public readonly reason: string
    ) {
        super(`Guardrail rule '${ruleName}' blocked execution: ${reason}`);
        this.name = 'GuardrailError';
    }
}

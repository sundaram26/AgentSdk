import type { z, ZodTypeAny } from 'zod';
import type { StructuredValidationResult } from './types.js';

export class StructuredOutputValidator<TSchema extends ZodTypeAny = ZodTypeAny> {
    constructor(private readonly schema: TSchema) {}

    public validate(text: string): StructuredValidationResult<z.infer<TSchema>> {
        const jsonString = this.extractJsonString(text);

        if (!jsonString) {
            return {
                success: false,
                error: 'Could not extract valid JSON structure from response.',
                formattedPrompt: '[Structured Output Validation Error]: Response did not contain valid JSON. Please respond strictly with a valid JSON object matching the required schema.',
            };
        }

        try {
            const parsedJson = JSON.parse(jsonString);
            const result = this.schema.safeParse(parsedJson);

            if (result.success) {
                return {
                    success: true,
                    data: result.data,
                };
            }

            // Build a plain-English, field-level error description for the LLM to self-repair
            const formattedIssues = result.error.issues
                .map((issue) => {
                    const field = issue.path.length > 0 ? `'${issue.path.join('.')}'` : '(root)';
                    const expected = 'expected' in issue ? ` (expected: ${issue.expected})` : '';
                    const received = 'received' in issue ? `, received: ${issue.received}` : '';
                    return `- Field ${field}: ${issue.message}${expected}${received}`;
                })
                .join('\n');

            return {
                success: false,
                error: `Schema validation failed: ${result.error.message}`,
                issues: result.error.issues,
                formattedPrompt: `[Structured Output Validation Error]: Your JSON response failed schema validation with ${result.error.issues.length} issue(s):\n\n${formattedIssues}\n\nPlease correct ONLY the fields listed above and respond with a complete valid JSON object.`,
            };
        } catch (err) {
            return {
                success: false,
                error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
                formattedPrompt: '[Structured Output Validation Error]: Response contained malformed JSON. Please format your output strictly as a clean, valid JSON object.',
            };
        }
    }

    private extractJsonString(text: string): string | null {
        const trimmed = text.trim();

        // 1. Try markdown code block match ```json ... ```
        const markdownMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/) || trimmed.match(/```\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            return markdownMatch[1].trim();
        }

        // 2. Try raw JSON object/array match `{ ... }` or `[ ... ]`
        const jsonObjectMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonObjectMatch && jsonObjectMatch[0]) {
            return jsonObjectMatch[0].trim();
        }

        return null;
    }
}

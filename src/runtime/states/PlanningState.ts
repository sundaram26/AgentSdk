import { AgentState } from './State.js';
import { ExecutingState } from './ExecutingState.js';
import { VerifyingState } from './VerifyingState.js';
import { FailedState } from './FailedState.js';
import { GuardrailError } from '../../guardrails/GuardrailError.js';
import type { RunContext, RunStatus, ToolCallInfo } from '../types.js';
import type { Message } from '../../llm/types.js';

export class PlanningState extends AgentState {
    public readonly status: RunStatus = 'PLANNING';

    public async execute(context: RunContext): Promise<AgentState> {
        // Enforce max turns guard before generating
        if (context.currentTurn > context.maxTurns) {
            return new FailedState(
                new Error(`Run exceeded maximum turn limit of ${context.maxTurns}`)
            );
        }

        // 1. Evaluate Input Guardrails on Turn 1
        if (context.currentTurn === 1 && context.inputPipeline) {
            const userMsgIndex = context.messages.findIndex((m) => m.role === 'user');
            if (userMsgIndex !== -1) {
                const userMsg = context.messages[userMsgIndex];
                if (userMsg) {
                    const { content: sanitizedInput, report } = await context.inputPipeline.execute(userMsg.content);

                    context.guardrailReports = context.guardrailReports || [];
                    context.guardrailReports.push(report);

                    if (!report.passed) {
                        const blockedEval = report.evaluations.find((e) => e.actionTaken === 'block');
                        if (blockedEval) {
                            return new FailedState(
                                new GuardrailError(blockedEval.ruleName, blockedEval.reason || 'Input blocked by guardrail policy')
                            );
                        }
                    }

                    userMsg.content = sanitizedInput;
                }
            }
        }

        try {
            // Build model prompt messages with system prompt and available tools
            const messagesToSubmit = this.buildPromptMessages(context);

            const response = await context.llm.generate(messagesToSubmit, {
                model: context.model,
                temperature: context.temperature,
                maxTokens: context.maxTokens,
            });

            // Store model response in context message history
            context.messages.push({
                role: 'assistant',
                content: response.text,
            });

            // Check if response contains a tool call
            const toolCall = this.parseToolCall(response.text, context);
            if (toolCall) {
                context.pendingToolCalls = [toolCall];
                return new ExecutingState();
            }

            // No tool call -> transition to VerifyingState with final answer
            return new VerifyingState(response.text);
        } catch (error) {
            return new FailedState(
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }

    private buildPromptMessages(context: RunContext): Message[] {
        const messages: Message[] = [];

        // 1. Add System Instruction
        let systemContent = context.systemInstruction || '';
        const registeredTools = context.tools.getAll();

        if (registeredTools.length > 0) {
            const toolDescriptions = registeredTools
                .map((t) => `- ${t.name}: ${t.description}`)
                .join('\n');

            const toolSystemPrompt = `\nYou have access to the following tools:\n${toolDescriptions}\n\nTo use a tool, respond ONLY with a JSON object in this exact format:\n\`\`\`json\n{\n  "tool": "toolName",\n  "arguments": { ... }\n}\n\`\`\``;
            systemContent += toolSystemPrompt;
        }

        if (context.outputSchema) {
            systemContent += '\n\nIMPORTANT: Your final response MUST be a valid JSON object matching the requested output schema.';
        }

        if (systemContent.trim()) {
            messages.push({
                role: 'system',
                content: systemContent,
            });
        }

        // 2. Append Chat History
        messages.push(...context.messages);

        return messages;
    }

    private parseToolCall(text: string, context: RunContext): ToolCallInfo | null {
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*"tool"[\s\S]*\})/);
            if (!jsonMatch) return null;

            const jsonStr = jsonMatch[1] || jsonMatch[0];
            if (!jsonStr) return null;

            const parsed = JSON.parse(jsonStr.trim());

            if (parsed && typeof parsed.tool === 'string' && context.tools.has(parsed.tool)) {
                return {
                    id: `call_${Date.now()}`,
                    name: parsed.tool,
                    arguments: (typeof parsed.arguments === 'object' && parsed.arguments !== null) ? parsed.arguments : {},
                };
            }
        } catch {
            // Ignore JSON parsing errors
        }
        return null;
    }
}

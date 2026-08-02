import { AgentState } from './State.js';
import { defaultStateFactory } from './StateFactory.js';
import { GuardrailError } from '../../guardrails/GuardrailError.js';
import type { RunContext, RunStatus, ToolCallInfo } from '../types.js';
import type { Message } from '../../llm/types.js';
import { ContextPruner } from '../../context/ContextPruner.js';

export class PlanningState extends AgentState {
    public readonly status: RunStatus = 'PLANNING';

    public async execute(context: RunContext): Promise<AgentState> {
        const factory = context.stateFactory ?? defaultStateFactory;

        // Enforce max turns guard before generating
        if (context.currentTurn > context.maxTurns) {
            return factory.create('FAILED', new Error(`Run exceeded maximum turn limit of ${context.maxTurns}`));
        }

        // 1. Evaluate Input Guardrails and Load Memory Context on Turn 1
        if (context.currentTurn === 1) {
            if (context.memoryManager && context.sessionId) {
                const memContext = await context.memoryManager.loadMemoryContext(context.sessionId);
                if (memContext.promptContext) {
                    context.systemInstruction = (context.systemInstruction || '') + memContext.promptContext;
                }
            }

            if (context.inputPipeline) {
                const userMsgIndex = context.messages.findIndex((m) => m.role === 'user');
                if (userMsgIndex !== -1) {
                    const userMsg = context.messages[userMsgIndex];
                    if (userMsg) {
                        const spanId = context.tracer?.startSpan('input_guardrail', 'guardrail', { stage: 'input' });
                        const { content: sanitizedInput, report } = await context.inputPipeline.execute(userMsg.content);

                        context.guardrailReports = context.guardrailReports || [];
                        context.guardrailReports.push(report);

                        if (spanId && context.tracer) {
                            context.tracer.endSpan(spanId, undefined, { passed: report.passed });
                        }

                        if (!report.passed) {
                            const blockedEval = report.evaluations.find((e) => e.actionTaken === 'block');
                            if (blockedEval) {
                                if (context.eventEmitter) {
                                    context.eventEmitter.emitEvent({
                                        type: 'guardrail_triggered',
                                        payload: {
                                            stage: 'input',
                                            ruleName: blockedEval.ruleName,
                                            action: blockedEval.actionTaken,
                                            reason: blockedEval.reason,
                                        },
                                    });
                                }
                                return factory.create(
                                    'FAILED',
                                    new GuardrailError(blockedEval.ruleName, blockedEval.reason || 'Input blocked by guardrail policy')
                                );
                            }
                        }

                        userMsg.content = sanitizedInput;
                    }
                }
            }
        }

        try {
            // Build model prompt messages with system prompt and available tools
            let messagesToSubmit = this.buildPromptMessages(context);

            // Apply Context Pruning & Token Budgeting if configured
            const pruner = context.contextPruner || (context.maxContextTokens ? new ContextPruner({ maxContextTokens: context.maxContextTokens }) : undefined);
            if (pruner) {
                const pruneResult = pruner.prune(messagesToSubmit);
                messagesToSubmit = pruneResult.messages;
            }

            const llmSpanId = context.tracer?.startSpan(`llm_generate_turn_${context.currentTurn}`, 'llm', {
                model: context.model,
                provider: context.llm.providerName,
            });

            const registeredTools = context.tools.getAll();

            const response = await context.llm.generate(messagesToSubmit, {
                model: context.model,
                temperature: context.temperature,
                maxTokens: context.maxTokens,
                tools: registeredTools.length > 0 ? registeredTools : undefined,
            });

            if (llmSpanId && context.tracer) {
                context.tracer.endSpan(llmSpanId, undefined, { responseLength: response.text.length });
            }

            // Emit text_delta event
            if (context.eventEmitter) {
                context.eventEmitter.emitEvent({
                    type: 'text_delta',
                    payload: { delta: response.text },
                });
            }

            // Store model response in context message history
            context.messages.push({
                role: 'assistant',
                content: response.text,
            });

            // 1. Primary path: Native provider tool call detection (OpenAI tool_calls, Claude tool_use, Gemini functionCall)
            if (response.toolCalls && response.toolCalls.length > 0) {
                context.pendingToolCalls = response.toolCalls;
                return factory.create('EXECUTING');
            }

            // 2. Secondary path: Multi-strategy text parsing fallback for prompt-only LLMs
            const textToolCall = this.parseToolCall(response.text, context);
            if (textToolCall) {
                context.pendingToolCalls = [textToolCall];
                return factory.create('EXECUTING');
            }

            // No tool call -> transition to VerifyingState with final answer
            return factory.create('VERIFYING', response.text);
        } catch (error) {
            return factory.create('FAILED', error instanceof Error ? error : new Error(String(error)));
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
        const candidates: string[] = [];

        // Strategy 1: ```json ... ``` fenced code block
        const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());

        // Strategy 2: ``` ... ``` unfenced code block
        const unfencedMatch = text.match(/```\s*([\s\S]*?)\s*```/);
        if (unfencedMatch?.[1]) candidates.push(unfencedMatch[1].trim());

        // Strategy 3: first complete JSON object in the raw text
        const rawJsonMatch = text.match(/\{[\s\S]*"tool"[\s\S]*\}/);
        if (rawJsonMatch?.[0]) candidates.push(rawJsonMatch[0].trim());

        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(candidate);
                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    typeof parsed.tool === 'string' &&
                    parsed.tool.length > 0 &&
                    context.tools.has(parsed.tool)
                ) {
                    return {
                        id: `call_${Date.now()}`,
                        name: parsed.tool,
                        arguments: (typeof parsed.arguments === 'object' && parsed.arguments !== null && !Array.isArray(parsed.arguments))
                            ? parsed.arguments
                            : {},
                    };
                }
            } catch {
                // Try next candidate
            }
        }

        return null;
    }
}

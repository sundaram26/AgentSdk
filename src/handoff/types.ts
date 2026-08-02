/** Reserved tool name automatically injected by HandoffManager. Conflicts with user-registered tools will throw at build time. */
export const HANDOFF_TOOL_NAME = 'handoff_to_agent' as const;

export interface HandoffToolInput {
    targetAgent: string;
    reason: string;
}

export interface HandoffPayload {
    targetAgent: string;
    reason: string;
    contextData?: Record<string, unknown> | undefined;
}

export interface HandoffResult {
    success: boolean;
    targetAgent: string;
    output: string;
}

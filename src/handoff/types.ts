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

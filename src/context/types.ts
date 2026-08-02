import type { Message } from '../llm/types.js';

export type PruningStrategy = 'sliding_window' | 'fifo';

export interface ContextPrunerOptions {
    maxContextTokens?: number | undefined;
    maxMessages?: number | undefined;
    strategy?: PruningStrategy | undefined;
    preserveSystemPrompt?: boolean | undefined;
    preserveInitialUserMsg?: boolean | undefined;
    customTokenizer?: ((text: string) => number) | undefined;
}

export interface PruneResult {
    messages: Message[];
    totalTokens: number;
    prunedCount: number;
}

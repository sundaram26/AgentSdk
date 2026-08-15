import type { Message } from '../llm/types.js';
import type { ContextPrunerOptions, PruneResult, PruningStrategy } from './types.js';
import { TokenCounter } from './TokenCounter.js';

export class ContextPruner {
    private maxContextTokens?: number | undefined;
    private maxMessages?: number | undefined;
    private strategy: PruningStrategy;
    private preserveSystemPrompt: boolean;
    private preserveInitialUserMsg: boolean;
    private tokenCounter: TokenCounter;

    constructor(options?: ContextPrunerOptions) {
        this.maxContextTokens = options?.maxContextTokens;
        this.maxMessages = options?.maxMessages;
        this.strategy = options?.strategy ?? 'sliding_window';
        this.preserveSystemPrompt = options?.preserveSystemPrompt ?? true;
        this.preserveInitialUserMsg = options?.preserveInitialUserMsg ?? true;
        this.tokenCounter = new TokenCounter(options?.customTokenizer);
    }

    public prune(messages: Message[]): PruneResult {
        if (!messages || messages.length === 0) {
            return { messages: [], totalTokens: 0, prunedCount: 0 };
        }

        let workingMessages = [...messages];
        const originalCount = workingMessages.length;

        // Separate pinned head messages if required
        let systemMsg: Message | undefined;
        let initialUserMsg: Message | undefined;

        if (this.preserveSystemPrompt && workingMessages[0]?.role === 'system') {
            systemMsg = workingMessages.shift();
        }

        if (this.preserveInitialUserMsg && workingMessages.length > 0) {
            const firstUserIdx = workingMessages.findIndex((m) => m.role === 'user');
            if (firstUserIdx !== -1) {
                initialUserMsg = workingMessages.splice(firstUserIdx, 1)[0];
            }
        }

        // Apply message count threshold pruning
        if (this.maxMessages && workingMessages.length > this.maxMessages) {
            workingMessages = this.applyMessageLimit(workingMessages, this.maxMessages);
        }

        // Apply token budget pruning
        if (this.maxContextTokens) {
            let pinnedTokens = 0;
            if (systemMsg) pinnedTokens += this.tokenCounter.countMessage(systemMsg);
            if (initialUserMsg) pinnedTokens += this.tokenCounter.countMessage(initialUserMsg);

            const availableTokens = Math.max(0, this.maxContextTokens - pinnedTokens);
            workingMessages = this.applyTokenLimit(workingMessages, availableTokens);
        }

        // Reconstruct message list preserving pinned head
        const resultMessages: Message[] = [];
        if (systemMsg) resultMessages.push(systemMsg);
        if (initialUserMsg) resultMessages.push(initialUserMsg);
        resultMessages.push(...workingMessages);

        const totalTokens = this.tokenCounter.countMessages(resultMessages);
        const prunedCount = Math.max(0, originalCount - resultMessages.length);

        return { messages: resultMessages, totalTokens, prunedCount };
    }

    /**
     * `fifo` — drops oldest messages first (front of array) until within limit.
     * `sliding_window` — always keeps the MOST RECENT N messages forming a contiguous window.
     */
    private applyMessageLimit(messages: Message[], limit: number): Message[] {
        if (this.strategy === 'sliding_window') {
            // Keep the most-recent `limit` messages as a contiguous tail window
            return messages.slice(-limit);
        }
        // fifo: drop from the front until count fits
        return messages.slice(messages.length - limit);
    }

    private applyTokenLimit(messages: Message[], availableTokens: number): Message[] {
        const working = [...messages];

        if (this.strategy === 'sliding_window') {
            // Keep building a window from the END until we exceed budget
            let kept: Message[] = [];
            let usedTokens = 0;
            for (let i = working.length - 1; i >= 0; i--) {
                const msg = working[i]!;
                const cost = this.tokenCounter.countMessage(msg);
                if (usedTokens + cost > availableTokens) break;
                usedTokens += cost;
                kept.unshift(msg);
            }
            return kept;
        }

        // fifo: drop from the front until budget fits
        while (working.length > 0 && this.tokenCounter.countMessages(working) > availableTokens) {
            working.shift();
        }
        return working;
    }
}

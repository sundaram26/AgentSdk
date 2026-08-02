import type { Message } from '../llm/types.js';

export class TokenCounter {
    private customTokenizer?: ((text: string) => number) | undefined;

    constructor(customTokenizer?: ((text: string) => number) | undefined) {
        this.customTokenizer = customTokenizer;
    }

    public countText(text: string): number {
        if (!text) return 0;
        if (this.customTokenizer) {
            return this.customTokenizer(text);
        }
        // Standard OpenAI/Claude heuristic: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    public countMessage(message: Message): number {
        // Base overhead per message (role + formatting ~4 tokens)
        const roleOverhead = 4;
        return roleOverhead + this.countText(message.content);
    }

    public countMessages(messages: Message[]): number {
        return messages.reduce((acc, msg) => acc + this.countMessage(msg), 0);
    }
}

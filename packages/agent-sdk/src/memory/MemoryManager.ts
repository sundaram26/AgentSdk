import type { MemoryStore, SessionData, Fact, Episode, MemoryOptions } from './types.js';
import type { Message } from '../llm/types.js';
import type { LLMPort } from '../llm/LLMPort.js';
import { MemorySessionStore } from './MemorySessionStore.js';

function isMemoryStore(value: MemoryOptions | MemoryStore): value is MemoryStore {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as MemoryStore).getSession === 'function' &&
        typeof (value as MemoryStore).saveSession === 'function' &&
        typeof (value as MemoryStore).addFact === 'function'
    );
}

export class MemoryManager {
    public readonly store: MemoryStore;
    private llmPort?: LLMPort | undefined;
    private llmModel?: string | undefined;
    private autoExtractFacts: boolean;
    private autoSummarizeEpisodes: boolean;

    constructor(options?: MemoryOptions | MemoryStore) {
        if (options && isMemoryStore(options)) {
            // Developer passed a MemoryStore directly
            this.store = options;
            this.autoExtractFacts = false;
            this.autoSummarizeEpisodes = false;
        } else {
            // Developer passed MemoryOptions
            this.store = options?.store || new MemorySessionStore();
            this.llmPort = options?.llm;
            this.llmModel = options?.llmModel;
            this.autoExtractFacts = options?.autoExtractFacts ?? false;
            this.autoSummarizeEpisodes = options?.autoSummarizeEpisodes ?? false;
        }
    }

    public async loadMemoryContext(sessionId: string): Promise<{ messages: Message[]; promptContext: string }> {
        const session = await this.store.getSession(sessionId);
        if (!session) {
            return { messages: [], promptContext: '' };
        }

        let contextPrompt = '';

        if (session.facts.length > 0) {
            const factsList = session.facts.map((f: Fact) => `- ${f.fact}${f.category ? ` (${f.category})` : ''}`).join('\n');
            contextPrompt += `\n\n[USER PROFILE & FACTUAL MEMORY]:\n${factsList}`;
        }

        if (session.episodes.length > 0) {
            const episodesList = session.episodes.map((e: Episode) => `- Summary: ${e.summary}`).join('\n');
            contextPrompt += `\n\n[EPISODIC MEMORY SUMMARIES]:\n${episodesList}`;
        }

        return {
            messages: [...session.messages],
            promptContext: contextPrompt,
        };
    }

    public async saveRunMemory(sessionId: string, messages: Message[]): Promise<void> {
        let session = await this.store.getSession(sessionId);
        if (!session) {
            session = {
                sessionId,
                messages: [],
                facts: [],
                episodes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        session.messages = [...messages];
        session.updatedAt = new Date();
        await this.store.saveSession(sessionId, session);

        // Automated fact extraction if developer enabled it and attached LLM
        if (this.autoExtractFacts && this.llmPort) {
            const lastUserMsg = messages.filter((m: Message) => m.role === 'user').pop();
            if (lastUserMsg) {
                await this.extractFactsWithLLM(sessionId, lastUserMsg.content);
            }
        }

        // Automated episode summarization if turn count >= 6
        if (this.autoSummarizeEpisodes && this.llmPort && messages.length >= 6) {
            await this.summarizeEpisodeWithLLM(sessionId, messages);
        }
    }

    public async extractFactsWithLLM(sessionId: string, text: string): Promise<Fact[]> {
        if (!this.llmPort || !this.llmModel) return [];

        try {
            const response = await this.llmPort.generate(
                [
                    {
                        role: 'system',
                        content: 'Extract key facts, user preferences, or profile attributes from the user input. Respond with bullet points starting with "- ". If no facts, respond with "NONE".',
                    },
                    { role: 'user', content: text },
                ],
                { model: this.llmModel }
            );

            if (!response.text || response.text.includes('NONE')) return [];

            const lines = response.text.split('\n').filter((l: string) => l.trim().startsWith('- '));
            const extractedFacts: Fact[] = [];

            for (const line of lines) {
                const factStr = line.replace(/^- /, '').trim();
                if (factStr) {
                    const fact = await this.store.addFact(sessionId, factStr, 'auto-extracted');
                    extractedFacts.push(fact);
                }
            }

            return extractedFacts;
        } catch {
            return [];
        }
    }

    public async summarizeEpisodeWithLLM(sessionId: string, messages: Message[]): Promise<Episode | null> {
        if (!this.llmPort || !this.llmModel) return null;

        try {
            const chatText = messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n');
            const response = await this.llmPort.generate(
                [
                    {
                        role: 'system',
                        content: 'Summarize the core outcome and key decisions of this conversation in 1-2 concise sentences.',
                    },
                    { role: 'user', content: chatText },
                ],
                { model: this.llmModel }
            );

            if (!response.text) return null;

            return await this.store.addEpisode(sessionId, response.text.trim());
        } catch {
            return null;
        }
    }

    public async addFact(sessionId: string, fact: string, category?: string): Promise<Fact> {
        return this.store.addFact(sessionId, fact, category);
    }

    public async getFacts(sessionId: string): Promise<Fact[]> {
        return this.store.getFacts(sessionId);
    }

    public async deleteFact(sessionId: string, factId: string): Promise<boolean> {
        return this.store.deleteFact(sessionId, factId);
    }

    public async addEpisode(sessionId: string, summary: string): Promise<Episode> {
        return this.store.addEpisode(sessionId, summary);
    }

    public async getEpisodes(sessionId: string): Promise<Episode[]> {
        return this.store.getEpisodes(sessionId);
    }

    public async clear(sessionId: string): Promise<void> {
        return this.store.clear(sessionId);
    }
}

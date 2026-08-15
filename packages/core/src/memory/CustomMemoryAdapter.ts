import type { MemoryStore, SessionData, Fact, Episode, CustomMemoryHandler } from './types.js';
import { MemorySessionStore } from './MemorySessionStore.js';

export class CustomMemoryAdapter implements MemoryStore {
    private fallbackStore = new MemorySessionStore();

    constructor(private readonly handler: CustomMemoryHandler) {}

    public async getSession(sessionId: string): Promise<SessionData | null> {
        if (this.handler.getSession) {
            return this.handler.getSession(sessionId);
        }
        return this.fallbackStore.getSession(sessionId);
    }

    public async saveSession(sessionId: string, data: SessionData): Promise<void> {
        if (this.handler.saveSession) {
            return this.handler.saveSession(sessionId, data);
        }
        return this.fallbackStore.saveSession(sessionId, data);
    }

    public async addFact(sessionId: string, fact: string, category?: string): Promise<Fact> {
        if (this.handler.addFact) {
            return this.handler.addFact(sessionId, fact, category);
        }
        return this.fallbackStore.addFact(sessionId, fact, category);
    }

    public async getFacts(sessionId: string): Promise<Fact[]> {
        if (this.handler.getFacts) {
            return this.handler.getFacts(sessionId);
        }
        return this.fallbackStore.getFacts(sessionId);
    }

    public async deleteFact(sessionId: string, factId: string): Promise<boolean> {
        return this.fallbackStore.deleteFact(sessionId, factId);
    }

    public async addEpisode(sessionId: string, summary: string): Promise<Episode> {
        if (this.handler.addEpisode) {
            return this.handler.addEpisode(sessionId, summary);
        }
        return this.fallbackStore.addEpisode(sessionId, summary);
    }

    public async getEpisodes(sessionId: string): Promise<Episode[]> {
        return this.fallbackStore.getEpisodes(sessionId);
    }

    public async clear(sessionId: string): Promise<void> {
        return this.fallbackStore.clear(sessionId);
    }
}

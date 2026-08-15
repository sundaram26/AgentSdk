import type { MemoryStore, SessionData, Fact, Episode } from './types.js';

export class MemorySessionStore implements MemoryStore {
    private sessions = new Map<string, SessionData>();

    public async getSession(sessionId: string): Promise<SessionData | null> {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        return {
            ...session,
            messages: [...session.messages],
            facts: [...session.facts],
            episodes: [...session.episodes],
        };
    }

    public async saveSession(sessionId: string, data: SessionData): Promise<void> {
        this.sessions.set(sessionId, {
            ...data,
            updatedAt: new Date(),
        });
    }

    public async addFact(sessionId: string, fact: string, category?: string): Promise<Fact> {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = {
                sessionId,
                messages: [],
                facts: [],
                episodes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.sessions.set(sessionId, session);
        }

        const newFact: Fact = {
            id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fact,
            category,
            createdAt: new Date(),
        };

        session.facts.push(newFact);
        session.updatedAt = new Date();
        return newFact;
    }

    public async getFacts(sessionId: string): Promise<Fact[]> {
        const session = this.sessions.get(sessionId);
        return session ? [...session.facts] : [];
    }

    public async deleteFact(sessionId: string, factId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const initialLen = session.facts.length;
        session.facts = session.facts.filter((f) => f.id !== factId);
        return session.facts.length < initialLen;
    }

    public async addEpisode(sessionId: string, summary: string): Promise<Episode> {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = {
                sessionId,
                messages: [],
                facts: [],
                episodes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.sessions.set(sessionId, session);
        }

        const episode: Episode = {
            id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            sessionId,
            summary,
            timestamp: new Date(),
        };

        session.episodes.push(episode);
        session.updatedAt = new Date();
        return episode;
    }

    public async getEpisodes(sessionId: string): Promise<Episode[]> {
        const session = this.sessions.get(sessionId);
        return session ? [...session.episodes] : [];
    }

    public async clear(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }
}

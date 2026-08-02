import * as fs from 'fs';
import * as path from 'path';
import type {
    MemoryStore,
    SessionData,
    Fact,
    Episode,
    FileMemoryStoreOptions,
    SerializedSessionData,
} from './types.js';

export class FileMemoryStore implements MemoryStore {
    private dirPath: string;

    constructor(options: FileMemoryStoreOptions) {
        this.dirPath = options.dirPath;
        if (!fs.existsSync(this.dirPath)) {
            fs.mkdirSync(this.dirPath, { recursive: true });
        }
    }

    private getFilePath(sessionId: string): string {
        const safeName = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.dirPath, `${safeName}.json`);
    }

    public async getSession(sessionId: string): Promise<SessionData | null> {
        const filePath = this.getFilePath(sessionId);
        if (!fs.existsSync(filePath)) return null;

        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw) as SerializedSessionData;

            return {
                sessionId: data.sessionId,
                messages: data.messages || [],
                metadata: data.metadata,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                facts: (data.facts || []).map((f) => ({
                    id: f.id,
                    fact: f.fact,
                    category: f.category,
                    createdAt: new Date(f.createdAt),
                })),
                episodes: (data.episodes || []).map((e) => ({
                    id: e.id,
                    sessionId: e.sessionId,
                    summary: e.summary,
                    timestamp: new Date(e.timestamp),
                })),
            };
        } catch {
            return null;
        }
    }

    public async saveSession(sessionId: string, data: SessionData): Promise<void> {
        const filePath = this.getFilePath(sessionId);
        const updated = {
            ...data,
            updatedAt: new Date(),
        };
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    }

    public async addFact(sessionId: string, fact: string, category?: string): Promise<Fact> {
        let session = await this.getSession(sessionId);
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

        const newFact: Fact = {
            id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fact,
            category,
            createdAt: new Date(),
        };

        session.facts.push(newFact);
        await this.saveSession(sessionId, session);
        return newFact;
    }

    public async getFacts(sessionId: string): Promise<Fact[]> {
        const session = await this.getSession(sessionId);
        return session ? session.facts : [];
    }

    public async deleteFact(sessionId: string, factId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) return false;

        const initialLen = session.facts.length;
        session.facts = session.facts.filter((f) => f.id !== factId);
        if (session.facts.length < initialLen) {
            await this.saveSession(sessionId, session);
            return true;
        }
        return false;
    }

    public async addEpisode(sessionId: string, summary: string): Promise<Episode> {
        let session = await this.getSession(sessionId);
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

        const episode: Episode = {
            id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            sessionId,
            summary,
            timestamp: new Date(),
        };

        session.episodes.push(episode);
        await this.saveSession(sessionId, session);
        return episode;
    }

    public async getEpisodes(sessionId: string): Promise<Episode[]> {
        const session = await this.getSession(sessionId);
        return session ? session.episodes : [];
    }

    public async clear(sessionId: string): Promise<void> {
        const filePath = this.getFilePath(sessionId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

import type { Message } from '../llm/types.js';
import type { LLMPort } from '../llm/LLMPort.js';

export interface Fact {
    id: string;
    fact: string;
    category?: string | undefined;
    createdAt: Date;
}

export interface Episode {
    id: string;
    sessionId: string;
    summary: string;
    timestamp: Date;
}

export interface SessionData {
    sessionId: string;
    messages: Message[];
    facts: Fact[];
    episodes: Episode[];
    metadata?: Record<string, unknown> | undefined;
    createdAt: Date;
    updatedAt: Date;
}

export interface SerializedFact {
    id: string;
    fact: string;
    category?: string | undefined;
    createdAt: string;
}

export interface SerializedEpisode {
    id: string;
    sessionId: string;
    summary: string;
    timestamp: string;
}

export interface SerializedSessionData {
    sessionId: string;
    messages: Message[];
    facts: SerializedFact[];
    episodes: SerializedEpisode[];
    metadata?: Record<string, unknown> | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface MemoryStore {
    getSession(sessionId: string): Promise<SessionData | null>;
    saveSession(sessionId: string, data: SessionData): Promise<void>;
    addFact(sessionId: string, fact: string, category?: string): Promise<Fact>;
    getFacts(sessionId: string): Promise<Fact[]>;
    deleteFact(sessionId: string, factId: string): Promise<boolean>;
    addEpisode(sessionId: string, summary: string): Promise<Episode>;
    getEpisodes(sessionId: string): Promise<Episode[]>;
    clear(sessionId: string): Promise<void>;
}

export interface MemoryOptions {
    store?: MemoryStore | undefined;
    llm?: LLMPort | undefined;
    autoExtractFacts?: boolean | undefined;
    autoSummarizeEpisodes?: boolean | undefined;
}

export interface FileMemoryStoreOptions {
    dirPath: string;
}

export interface CustomMemoryHandler {
    getSession?: ((sessionId: string) => Promise<SessionData | null>) | undefined;
    saveSession?: ((sessionId: string, data: SessionData) => Promise<void>) | undefined;
    addFact?: ((sessionId: string, fact: string, category?: string) => Promise<Fact>) | undefined;
    getFacts?: ((sessionId: string) => Promise<Fact[]>) | undefined;
    addEpisode?: ((sessionId: string, summary: string) => Promise<Episode>) | undefined;
}

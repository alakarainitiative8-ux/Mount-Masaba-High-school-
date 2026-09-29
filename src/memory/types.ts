export type MemoryScope = 'school' | 'subject' | 'student' | 'conversation';
export type MemoryKind =
  | 'knowledge'
  | 'learning_progress'
  | 'preference'
  | 'goal'
  | 'misconception'
  | 'conversation_summary'
  | 'document';

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  ownerId?: string;
  subjectId?: string;
  kind: MemoryKind;
  key: string;
  content: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MemoryQuery {
  scope: MemoryScope;
  ownerId?: string;
  subjectId?: string;
  query?: string;
  kind?: MemoryKind;
  limit?: number;
}

export interface MemorySearchResult {
  memory: MemoryRecord;
  score: number;
}

export interface MemoryStore {
  put(memory: MemoryRecord): Promise<void>;
  get(id: string): Promise<MemoryRecord | null>;
  search(query: MemoryQuery): Promise<MemorySearchResult[]>;
  delete(id: string): Promise<void>;
}

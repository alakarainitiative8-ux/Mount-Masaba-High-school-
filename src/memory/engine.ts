import crypto from 'node:crypto';
import type { MemoryQuery, MemoryRecord, MemorySearchResult, MemoryStore } from './types';

export class AIMemoryEngine {
  constructor(private readonly store: MemoryStore) {}

  async remember(input: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const now = new Date().toISOString();
    const memory: MemoryRecord = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.store.put(memory);
    return memory;
  }

  async recall(query: MemoryQuery): Promise<MemorySearchResult[]> {
    return this.store.search(query);
  }

  async forget(id: string) {
    await this.store.delete(id);
  }

  async context(query: MemoryQuery, maxCharacters = 24000) {
    const results = await this.recall(query);
    let used = 0;
    const selected: MemoryRecord[] = [];
    for (const result of results) {
      const text = result.memory.content;
      if (used + text.length > maxCharacters) continue;
      selected.push(result.memory);
      used += text.length;
    }
    return selected;
  }
}

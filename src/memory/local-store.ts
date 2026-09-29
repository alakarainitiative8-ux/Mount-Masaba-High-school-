import type { MemoryQuery, MemoryRecord, MemorySearchResult, MemoryStore } from './types';

function score(text: string, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const haystack = text.toLowerCase();
  const terms = q.split(/\\s+/).filter(Boolean);
  let hits = 0;
  for (const term of terms) if (haystack.includes(term)) hits++;
  return terms.length ? hits / terms.length : 0;
}

/**
 * Development/test store only.
 * Production memory should use an external persistent object/index store.
 */
export class LocalMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  async put(memory: MemoryRecord) {
    this.records.set(memory.id, memory);
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async search(query: MemoryQuery): Promise<MemorySearchResult[]> {
    const rows = [...this.records.values()]
      .filter(m => m.scope === query.scope)
      .filter(m => !query.ownerId || m.ownerId === query.ownerId)
      .filter(m => !query.subjectId || m.subjectId === query.subjectId)
      .filter(m => !query.kind || m.kind === query.kind)
      .map(m => ({
        memory: m,
        score: score([m.key, m.content, JSON.stringify(m.metadata ?? {})].join(' '), query.query ?? '')
      }))
      .filter(r => !query.query || r.score > 0)
      .sort((a, b) => b.score - a.score);

    return rows.slice(0, Math.min(query.limit ?? 20, 100));
  }

  async delete(id: string) {
    this.records.delete(id);
  }
}

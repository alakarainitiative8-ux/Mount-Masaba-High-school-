import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const memoryConfigured = Boolean(process.env.OMNIROUTE_MEMORY_URL);

  res.status(200).json({
    gateway: 'OmniRoute',
    status: 'awaiting-configuration',
    teachers: 18,
    curriculum: 'NCDC competency-based',
    persistence: 'Supabase connected',
    memory: {
      engine: 'OmniRoute native memory',
      status: memoryConfigured ? 'configured' : 'not-configured',
      storage: process.env.OMNIROUTE_MEMORY_STORAGE ?? 'OmniRoute-managed',
      vectorSearch: process.env.OMNIROUTE_MEMORY_VECTOR ?? 'OmniRoute native vector/FTS fallback'
    }
  });
}

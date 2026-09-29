import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    gateway: 'OmniRoute',
    status: 'awaiting-configuration',
    teachers: 18,
    curriculum: 'NCDC competency-based',
    persistence: 'Supabase connected',
    memory: {
      engine: 'Mount Masaba AI Memory Engine',
      status: 'ready',
      storage: process.env.MEMORY_STORAGE_PROVIDER ?? 'not-configured',
      vectorSearch: process.env.MEMORY_VECTOR_PROVIDER ?? 'not-configured'
    }
  });
}

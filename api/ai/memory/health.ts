import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const configured = Boolean(process.env.OMNIROUTE_MEMORY_URL);

  res.status(200).json({
    service: 'OmniRoute native AI memory',
    status: configured ? 'configured' : 'not-configured',
    architecture: 'OmniRoute-managed memory with keyword/vector retrieval',
    productionStorage: process.env.OMNIROUTE_MEMORY_STORAGE ?? 'OmniRoute-managed',
    vectorSearch: process.env.OMNIROUTE_MEMORY_VECTOR ?? 'OmniRoute native vector/FTS fallback',
    note: 'No school or student data is stored by this health endpoint.'
  });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    service: 'Mount Masaba AI Memory Engine',
    status: 'ready',
    architecture: 'storage-provider-independent',
    productionStorage: process.env.MEMORY_STORAGE_PROVIDER ?? 'not-configured',
    vectorSearch: process.env.MEMORY_VECTOR_PROVIDER ?? 'not-configured',
    note: 'No school or student data is stored by this health endpoint.'
  });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const baseUrl = process.env.OMNIROUTE_URL;
  const key = process.env.OMNIROUTE_API_KEY;
  if (!baseUrl || !key) return res.status(503).json({ error: 'OmniRoute voice is not configured yet.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body?.audioBase64) return res.status(400).json({ error: 'audioBase64 is required' });
    const mime = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm';
    const binary = Buffer.from(body.audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([binary], { type: mime }), 'voice.webm');
    form.append('model', process.env.OMNIROUTE_STT_MODEL || 'deepgram/nova-3');
    const upstream = await fetch(new URL('/v1/audio/transcriptions', baseUrl).toString(), { method:'POST', headers:{Authorization:'Bearer '+key}, body:form });
    return res.status(upstream.status).json(await upstream.json());
  } catch { return res.status(500).json({ error: 'Voice transcription failed.' }); }
}

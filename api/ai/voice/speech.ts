import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const baseUrl = process.env.OMNIROUTE_URL;
  const key = process.env.OMNIROUTE_API_KEY;
  if (!baseUrl || !key) return res.status(503).json({ error: 'OmniRoute voice is not configured yet.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const input = typeof body?.input === 'string' ? body.input.trim() : '';
    if (!input) return res.status(400).json({ error: 'input is required' });
    const upstream = await fetch(new URL('/v1/audio/speech', baseUrl).toString(), {
      method:'POST', headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.OMNIROUTE_TTS_MODEL||'openai/tts-1',voice:process.env.OMNIROUTE_TTS_VOICE||'alloy',input,response_format:'mp3'})
    });
    const bytes=Buffer.from(await upstream.arrayBuffer());
    if(!upstream.ok) return res.status(upstream.status).send(bytes);
    res.setHeader('Content-Type',upstream.headers.get('content-type')||'audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(bytes);
  } catch { return res.status(500).json({error:'Voice speech generation failed.'}); }
}

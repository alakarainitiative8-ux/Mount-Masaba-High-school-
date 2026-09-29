import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl = process.env.OMNIROUTE_URL;
  const key = process.env.OMNIROUTE_API_KEY;
  const model = process.env.OMNIROUTE_CHAT_MODEL;

  if (!baseUrl || !key || !model) {
    return res.status(503).json({ error: 'OmniRoute AI answer is not configured yet.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const teacher = typeof body?.teacher === 'string' ? body.teacher.trim() : '';
    const level = typeof body?.level === 'string' ? body.level.trim() : '';
    const studentText = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!teacher || !level || !studentText) {
      return res.status(400).json({ error: 'teacher, level and text are required' });
    }

    const upstream = await fetch(new URL('/v1/chat/completions', baseUrl).toString(), {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are the ' + teacher + ' AI teacher for ' + level +
              ' at Mount Masaba High School. Teach according to the selected level. ' +
              'Be accurate, clear and practical. Explain step by step when useful. ' +
              'Do not invent school policies or curriculum facts.'
          },
          { role: 'user', content: studentText }
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status).json(data);

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(502).json({ error: 'OmniRoute returned no teacher answer.' });
    }

    return res.status(200).json({ answer: answer.trim() });
  } catch {
    return res.status(500).json({ error: 'Teacher answer generation failed.' });
  }
}

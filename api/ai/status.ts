import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const memoryConfigured = Boolean(process.env.OMNIROUTE_MEMORY_URL);
  const voiceConfigured = Boolean(process.env.OMNIROUTE_URL && process.env.OMNIROUTE_API_KEY);

  res.status(200).json({
    gateway: 'OmniRoute',
    status: voiceConfigured ? 'voice-ready' : 'awaiting-configuration',
    teachers: 18,
    curriculum: 'NCDC competency-based',
    persistence: 'Supabase connected',
    voice: {
      status: voiceConfigured ? 'configured' : 'not-configured',
      transcription: process.env.OMNIROUTE_STT_MODEL || 'deepgram/nova-3',
      speech: process.env.OMNIROUTE_TTS_MODEL || 'openai/tts-1'
    },
    memory: {
      engine: 'OmniRoute native memory',
      status: memoryConfigured ? 'configured' : 'not-configured',
      storage: process.env.OMNIROUTE_MEMORY_STORAGE ?? 'OmniRoute-managed',
      vectorSearch: process.env.OMNIROUTE_MEMORY_VECTOR ?? 'OmniRoute native vector/FTS fallback'
    }
  });
}

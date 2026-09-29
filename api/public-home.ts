import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bpxfyvxqciktrahaxkws.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

async function sb(path: string) {
  if (!SUPABASE_PUBLISHABLE_KEY) throw new Error('Supabase is not configured');
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY }
  });
  if (!res.ok) throw new Error('Supabase request failed');
  return res.json();
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const [gallery, news, events, info, contacts] = await Promise.all([
      sb('gallery?select=id,album,title,caption,image_path,thumb_path,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=24'),
      sb('news?select=id,title,excerpt,body,cover_image_path,published_at,status&status=eq.published&order=published_at.desc&limit=4'),
      sb('events?select=id,title,description,location,starts_at,ends_at,cover_image_path,is_public,status&is_public=eq.true&status=eq.published&order=starts_at.asc&limit=4'),
      sb('school_information?select=id,key,title,body,data,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=40'),
      sb('contact_information?select=id,contact_type,label,value,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=12')
    ]);
    return res.status(200).json({ connected: true, gallery, news, events, info, contacts });
  } catch {
    return res.status(200).json({ connected: false, gallery: [], news: [], events: [], info: [], contacts: [] });
  }
}

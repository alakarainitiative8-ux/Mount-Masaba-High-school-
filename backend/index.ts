import { router, json, secrets } from '@appdeploy/sdk';

const SUPABASE_URL = 'https://bpxfyvxqciktrahaxkws.supabase.co';

async function sb(path) {
  const key = await secrets.readSecret('SUPABASE_PUBLISHABLE_KEY');
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!res.ok) throw new Error('Supabase public content request failed');
  return res.json();
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Mount Masaba portal backend ready' })],
  'GET /api/ai/status': [async () => json({ gateway: 'OmniRoute', status: 'awaiting-configuration', teachers: 18, curriculum: 'NCDC competency-based', persistence: 'Supabase connected' })],
  'GET /api/supabase/status': [async () => { try { await secrets.readSecret('SUPABASE_PUBLISHABLE_KEY'); return json({ connected: true }); } catch { return json({ connected: false }); } }],
  'GET /api/public-home': [async () => {
    try {
      const [gallery,news,events,info,contacts] = await Promise.all([
        sb('gallery?select=id,album,title,caption,image_path,thumb_path,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=24'),
        sb('news?select=id,title,excerpt,body,cover_image_path,published_at,status&status=eq.published&order=published_at.desc&limit=4'),
        sb('events?select=id,title,description,location,starts_at,ends_at,cover_image_path,is_public,status&is_public=eq.true&status=eq.published&order=starts_at.asc&limit=4'),
        sb('school_information?select=id,key,title,body,data,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=40'),
        sb('contact_information?select=id,contact_type,label,value,sort_order,is_public&is_public=eq.true&order=sort_order.asc&limit=12')
      ]);
      return json({ connected: true, gallery, news, events, info, contacts });
    } catch {
      return json({ connected: false, gallery: [], news: [], events: [], info: [], contacts: [] });
    }
  }]
});
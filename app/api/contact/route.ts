import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validators/contact';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

async function hashIp(ip: string, pepper: string) {
  const data = new TextEncoder().encode(ip + pepper);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  const { name, email, phone, course, message, locale, website } = parsed.data;
  if (website) return NextResponse.json({ ok: true });

  const ua = req.headers.get('user-agent') ?? '';
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = await hashIp(ip, process.env.IP_HASH_PEPPER ?? 'rai-pepper');

  if (!isSupabaseConfigured()) {
    console.warn('[contact] Supabase not configured', { name, email, course, locale });
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('contact_submissions').insert({
      name, email, phone: phone || null, course, message, locale, user_agent: ua, ip_hash: ipHash,
    });
    if (error) { console.error('[contact] insert', error); return NextResponse.json({ error: 'Storage error' }, { status: 500 }); }
    return NextResponse.json({ ok: true, persisted: true });
  } catch (e) {
    console.error('[contact] unexpected', e);
    return NextResponse.json({ error: 'Unexpected' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/validators/booking';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  if (!isSupabaseConfigured()) {
    console.warn('[bookings] Supabase not configured', { name: d.name, email: d.email });
    return NextResponse.json({ ok: true, persisted: false });
  }
  try {
    const sb = getSupabaseAdmin();
    const { error, data } = await sb.from('assessment_bookings').insert({
      name: d.name, email: d.email, phone: d.phone, age_group: d.ageGroup,
      preferred_slots: d.preferredSlots, notes: d.notes || null, locale: d.locale,
    }).select('id').single();
    if (error) { console.error('[bookings] insert', error); return NextResponse.json({ error: 'Storage error' }, { status: 500 }); }
    return NextResponse.json({ ok: true, id: data?.id, persisted: true });
  } catch (e) {
    console.error('[bookings] unexpected', e);
    return NextResponse.json({ error: 'Unexpected' }, { status: 500 });
  }
}

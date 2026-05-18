import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { sendBookingConfirmation } from '@/lib/notify/email';
import { sendBookingWhatsApp } from '@/lib/notify/whatsapp';

export async function POST(req: Request) {
  // Auth: only authenticated admins may trigger
  const supa = await getSupabaseServer();
  const { data: userData } = await supa.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase missing' }, { status: 500 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: row, error } = await admin.from('assessment_bookings').select('*').eq('id', id).single();
  if (error || !row) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (row.status !== 'approved' || !row.approved_slot) {
    return NextResponse.json({ error: 'Booking not approved yet' }, { status: 400 });
  }

  const summary: string[] = [];
  // Email
  const emailRes = await sendBookingConfirmation({
    to: row.email, name: row.name, locale: row.locale, slot: row.approved_slot, room: row.room, notes: row.admin_notes,
  });
  summary.push(emailRes.ok ? 'email ✓' : emailRes.skipped ? 'email skipped (no Resend)' : 'email failed');

  // WhatsApp
  const waRes = await sendBookingWhatsApp({
    toPhoneE164: row.phone, name: row.name, locale: row.locale, slotISO: row.approved_slot, room: row.room,
  });
  summary.push(waRes.ok ? 'whatsapp ✓' : waRes.skipped ? 'whatsapp skipped' : 'whatsapp failed');

  await admin.from('assessment_bookings').update({
    notified_email: !!emailRes.ok,
    notified_wapp: !!waRes.ok,
  }).eq('id', id);

  return NextResponse.json({ ok: true, summary: summary.join(' · ') });
}

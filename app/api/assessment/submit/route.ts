import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assessmentSubmitSchema } from '@/lib/validators/assessment';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { sendAssessmentResult } from '@/lib/notify/email';

const inputSchema = assessmentSubmitSchema.extend({ sendEmail: z.boolean().optional() });

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  const d = parsed.data;

  // Always log the attempt if Supabase is configured (anonymous is fine)
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabaseAdmin();
      await sb.from('quiz_attempts').insert({
        email: d.email || null,
        name: d.name || null,
        age_group: d.ageGroup ?? null,
        level: d.level,
        score: d.score,
        answers: d.answers,
        locale: d.locale,
      });
    } catch (e) {
      console.warn('[assessment] log failed', e);
    }
  }

  // Optionally send email with the result
  if (d.sendEmail && d.email && isSupabaseConfigured()) {
    try {
      const sb = getSupabaseAdmin();
      const { data: rec } = await sb.from('quiz_recommendations')
        .select('books')
        .eq('level_code', d.level)
        .limit(1)
        .maybeSingle();
      const books = (rec?.books as string[] | undefined) ?? [];
      await sendAssessmentResult({
        to: d.email, name: d.name || null, locale: d.locale, level: d.level, books,
      });
    } catch (e) {
      console.warn('[assessment] email send failed', e);
    }
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { generateAnalysis, type AnsweredQuestion } from '@/lib/assessment/analysis';
import { sendAssessmentReport } from '@/lib/notify/assessment-email';

const inputSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ageGroup: z.enum(['child', 'teen', 'adult', 'professional']).optional(),
  locale: z.enum(['ar', 'en']),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  score: z.number().int().min(0),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedIndex: z.number().int().min(0).max(10),
        correct: z.boolean(),
        skillTag: z.string().nullable().optional(),
        difficulty: z.number().int().nullable().optional(),
      }),
    )
    .min(1),
  speech: z.object({ reference: z.string(), transcript: z.string() }).optional(),
  writing: z.object({ prompt: z.string(), text: z.string() }).optional(),
  sendEmail: z.boolean().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }
  const d = parsed.data;

  // Always log the attempt
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
      console.warn('[assessment/submit] log failed', e);
    }
  }

  // If the caller doesn't want the email yet (initial silent log), stop here.
  if (!d.sendEmail || !d.email) {
    return NextResponse.json({ ok: true });
  }

  // Generate the AI-graded analysis + radar chart + study plan
  const total = d.answers.length;
  let analysis;
  try {
    analysis = await generateAnalysis({
      name: d.name || (d.locale === 'ar' ? 'الطالب' : 'Student'),
      email: d.email,
      locale: d.locale,
      level: d.level,
      score: d.score,
      total,
      answers: d.answers as AnsweredQuestion[],
      speech: d.speech,
      writing: d.writing,
    });
  } catch (e) {
    console.error('[assessment/submit] analysis failed', e);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }

  // Send the branded report to admin
  try {
    const res = await sendAssessmentReport({
      to: d.email,
      name: d.name || (d.locale === 'ar' ? 'الطالب' : 'Student'),
      phone: d.phone || '',
      locale: d.locale,
      analysis,
    });
    if (!res.ok && !('skipped' in res && res.skipped)) {
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      emailed: !('skipped' in res && res.skipped),
      level: analysis.level,
    });
  } catch (e) {
    console.error('[assessment/submit] email failed', e);
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { generateAnalysis, type AnsweredQuestion } from '@/lib/assessment/analysis';
import { sendAssessmentReport } from '@/lib/notify/assessment-email';

/**
 * Assessment submission endpoint.
 *
 * Design goals:
 *   1. NEVER fail the request if the email send fails — the candidate's attempt is
 *      always logged to Supabase and the admin can review it later.
 *   2. NEVER hang waiting for DeepSeek — the AI call has its own internal timeout
 *      and falls back to a template narrative if it doesn't return in time.
 *   3. Return structured info (analysisError / emailError) so the client can give
 *      the user a precise message about what worked and what didn't.
 */

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
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // 1) Always log the attempt to Supabase. If this fails, we keep going — we still
  //    want to email the admin and give the candidate a result.
  let logged = false;
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
      logged = true;
    } catch (e) {
      console.warn('[assessment/submit] log failed', e);
    }
  }

  // 2) If the caller doesn't want the email yet (initial silent log), stop here.
  if (!d.sendEmail || !d.email) {
    return NextResponse.json({ ok: true, logged });
  }

  // 3) Generate analysis. If it throws, fall back to a minimal payload so the
  //    email still goes through with the MCQ data we already have.
  const total = d.answers.length;
  let analysis;
  let analysisError: string | null = null;
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
    analysisError = e instanceof Error ? e.message : String(e);
    console.error('[assessment/submit] analysis failed, using minimal fallback', e);
    // Minimal fallback so the admin still gets a notification.
    analysis = {
      level: d.level,
      score: d.score,
      total,
      skills: [],
      summary: 'Automated analysis was unavailable. Raw MCQ score included; please review.',
      competencies: [],
      recommendedCourse: {
        id: 'adults',
        title: 'Discovery Session',
        why: 'Book a free discovery session and we will recommend the best course in person.',
      },
      studyPlan: [],
      radarSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40"><text x="0" y="22" font-family="Georgia,serif" font-size="14" fill="#0F1B1D">Analysis unavailable — see raw answers below.</text></svg>',
      speechExcerpt: d.speech
        ? { reference: d.speech.reference, transcript: d.speech.transcript, accuracyPct: 0 }
        : undefined,
      writingExcerpt: d.writing
        ? { prompt: d.writing.prompt, text: d.writing.text, wordCount: d.writing.text.split(/\s+/).filter(Boolean).length }
        : undefined,
    };
  }

  // 4) Send the email to the admin inbox. If Resend isn't configured or returns
  //    an error, log it and return ok:true with emailed:false — the candidate's
  //    attempt is in Supabase, the admin can review it from /admin/assessments.
  let emailed = false;
  let emailError: string | null = null;
  try {
    const res = await sendAssessmentReport({
      to: d.email,
      name: d.name || (d.locale === 'ar' ? 'الطالب' : 'Student'),
      phone: d.phone || '',
      locale: d.locale,
      analysis,
    });
    if ('skipped' in res && res.skipped) {
      emailError = 'Email provider not configured (skipped)';
    } else if (!res.ok) {
      const errObj = (res as { error?: { message?: string; name?: string } | string }).error;
      emailError =
        typeof errObj === 'string'
          ? errObj
          : errObj?.message || errObj?.name || 'Email provider returned an error';
    } else {
      emailed = true;
    }
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e);
    console.error('[assessment/submit] email failed', e);
  }

  // 5) Always return 200 if we got this far — the candidate's attempt is recorded
  //    and the admin can follow up. The response carries the truth about whether
  //    the email went out so the client can show an appropriate message.
  return NextResponse.json({
    ok: true,
    logged,
    emailed,
    level: analysis.level,
    analysisError,
    emailError,
  });
}

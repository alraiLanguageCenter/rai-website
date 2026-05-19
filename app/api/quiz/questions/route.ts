import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

/**
 * Returns N randomly-sampled active quiz questions.
 * Uses the Postgres function `sample_quiz_questions(int)` to guarantee a
 * different set per attempt without leaking the entire question bank.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = parseInt(url.searchParams.get('count') ?? '20', 10);
  const count = Number.isFinite(requested) ? Math.max(5, Math.min(40, requested)) : 20;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, questions: [], reason: 'Supabase not configured' });
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc('sample_quiz_questions', { p_count: count });

  if (error) {
    // Fallback: simple select limit if the RPC isn't installed yet
    const fallback = await sb.from('quiz_questions').select('*').eq('active', true).limit(count);
    if (fallback.error) {
      console.error('[quiz/questions] fallback error', fallback.error);
      return NextResponse.json({ ok: false, error: fallback.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, questions: fallback.data ?? [], fallback: true });
  }

  return NextResponse.json({ ok: true, questions: data ?? [] });
}

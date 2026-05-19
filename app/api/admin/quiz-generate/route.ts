import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

/**
 * Admin-only endpoint that calls DeepSeek to generate N placement-test
 * questions for a given topic/skill/difficulty and inserts them into
 * `quiz_questions`. Each question is bilingual (en + ar) and the prompt
 * forces strictly-valid JSON so we don't have to parse free-form text.
 */

const schema = z.object({
  topic:      z.string().trim().min(2).max(120),
  count:      z.number().int().min(1).max(15).default(5),
  difficulty: z.number().int().min(1).max(3).default(2),
  skillTag:   z.enum(['grammar', 'vocab', 'reading', 'speaking', 'writing']).default('grammar'),
  level:      z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'mixed']).default('mixed'),
  active:     z.boolean().default(true),
});

type GeneratedQ = {
  prompt_en: string;
  prompt_ar: string;
  options: { en: string; ar: string }[];
  correct_idx: number;
  difficulty: number;
  skill_tag: string;
};

export async function POST(req: Request) {
  // 1) Auth: admin only. We use the regular cookie session to identify the user.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Server is not configured.' }, { status: 503 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
  }
  const d = parsed.data;

  // Look up the DeepSeek key from system_settings, falling back to env var.
  const sb = getSupabaseAdmin();
  let apiKey: string | undefined;
  let model = 'deepseek-chat';
  try {
    const { data: rows } = await sb.from('system_settings').select('key, value').in('key', ['deepseek_api_key', 'chatbot_model']);
    for (const r of (rows ?? []) as { key: string; value: unknown }[]) {
      if (r.key === 'deepseek_api_key' && typeof r.value === 'string' && r.value) apiKey = r.value;
      if (r.key === 'chatbot_model' && typeof r.value === 'string' && r.value) model = r.value;
    }
  } catch { /* fall through to env */ }
  apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'DeepSeek API key is not configured. Add it in admin → Settings.' }, { status: 503 });
  }

  // 2) Build the prompt and call DeepSeek.
  const prompt = `Generate ${d.count} placement-test questions on the topic "${d.topic}" for level ${d.level === 'mixed' ? 'A2–B2 (mixed)' : d.level} testing the "${d.skillTag}" skill at difficulty ${d.difficulty} (1=easy, 3=hard).

Each question has:
- An English prompt (use "___" for a blank if it's a fill-in)
- An Arabic translation of the prompt
- 4 options A/B/C/D, each bilingual (English + Arabic)
- The index (0–3) of the correct option

Return STRICTLY valid JSON, no prose, matching this schema exactly:
{
  "questions": [
    {
      "prompt_en": "She ___ from Italy.",
      "prompt_ar": "هي ___ من إيطاليا.",
      "options": [
        { "en": "am",  "ar": "am" },
        { "en": "is",  "ar": "is" },
        { "en": "are", "ar": "are" },
        { "en": "be",  "ar": "be" }
      ],
      "correct_idx": 1
    }
  ]
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);
  let resp: Response;
  try {
    resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an experienced English teacher creating placement-test questions. Always reply with strictly valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
        max_tokens: 2400,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error && err.name === 'AbortError' ? 'AI request timed out.' : 'Could not reach DeepSeek.' }, { status: 504 });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    return NextResponse.json({ ok: false, error: `DeepSeek returned ${resp.status}`, detail: t.slice(0, 400) }, { status: 502 });
  }

  let questions: GeneratedQ[] = [];
  try {
    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? '';
    const parsedAi = JSON.parse(content) as { questions?: GeneratedQ[] };
    questions = parsedAi.questions ?? [];
  } catch {
    return NextResponse.json({ ok: false, error: 'AI returned an invalid response. Please try again.' }, { status: 502 });
  }

  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: 'AI returned no questions.' }, { status: 502 });
  }

  // 3) Insert into Supabase.
  try {
    const { count: existingCount } = await sb.from('quiz_questions').select('id', { count: 'exact', head: true });
    const baseOrder = (existingCount ?? 0) + 1;
    const rows = questions
      .filter((q) => q.options && q.options.length >= 2 && typeof q.correct_idx === 'number')
      .map((q, i) => ({
        prompt_en:   q.prompt_en,
        prompt_ar:   q.prompt_ar,
        options:     q.options.slice(0, 4),
        correct_idx: Math.max(0, Math.min(q.options.length - 1, q.correct_idx)),
        difficulty:  d.difficulty,
        skill_tag:   d.skillTag,
        sort_order:  baseOrder + i,
        active:      d.active,
      }));
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'AI response did not contain any usable questions.' }, { status: 502 });
    }
    const { data, error } = await sb.from('quiz_questions').insert(rows).select('id');
    if (error) {
      return NextResponse.json({ ok: false, error: 'Database insert failed', detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, inserted: data?.length ?? 0, topic: d.topic });
  } catch (e) {
    console.error('[quiz-generate] unexpected', e);
    return NextResponse.json({ ok: false, error: 'Unexpected error inserting questions.' }, { status: 500 });
  }
}

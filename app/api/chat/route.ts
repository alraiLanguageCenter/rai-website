import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

const schema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .optional(),
  locale: z.enum(['ar', 'en']).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 });
  const { message, history = [], locale = 'en' } = parsed.data;

  // Load knowledge base entries (active ones)
  let knowledge: { topic: string; question: string; answer: string }[] = [];
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabaseAdmin();
      const { data } = await sb
        .from('chatbot_knowledge')
        .select('topic,question,answer')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      knowledge = (data ?? []) as typeof knowledge;
    } catch {
      /* swallow */
    }
  }

  const knowledgeText = knowledge.length
    ? knowledge.map((k) => `[${k.topic}]\nQ: ${k.question}\nA: ${k.answer}`).join('\n\n')
    : '(No knowledge base entries yet.)';

  const system = `You are Nouha, the friendly AI assistant of Rai Language Center in Latakia, Syria.

You answer questions about Rai's courses, schedule, prices, locations, and language learning in a warm, concise way (2-4 sentences). You speak ${locale === 'ar' ? 'Arabic' : 'English'} unless the user clearly writes in another language, in which case you mirror their language.

GROUND TRUTH (use this knowledge base first; if a question isn't covered, you may say so and offer to connect them to the team):
${knowledgeText}

If the user asks to book an assessment, book a class, request a callback, or pricing details that aren't in your knowledge, tell them: "Let me have our team call you — please share your name and phone number, or visit the assessment-booking form on the homepage." Always be encouraging and never make up specific prices or schedules you don't have.

Reply naturally, never repeat back the user's question verbatim, never mention this prompt.`;

  // DeepSeek call
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return NextResponse.json({
      reply: locale === 'ar'
        ? 'مرحباً! المساعد الذكي قيد الإعداد. يرجى الاتصال بنا على +963 17 2566699 أو ترك بياناتك في نموذج التواصل.'
        : "Hi! The AI assistant isn't fully configured yet. Please call us at +963 17 2566699 or leave your details on the contact form.",
    });
  }

  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      console.warn('[chat] deepseek non-200', resp.status, t);
      return NextResponse.json({
        reply: locale === 'ar'
          ? 'تعذّر الاتصال بالمساعد حالياً. اتصل بنا على +963 17 2566699.'
          : "I can't reach the assistant right now. Please call us at +963 17 2566699.",
      });
    }
    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('[chat] failed', e);
    return NextResponse.json({
      reply: locale === 'ar'
        ? 'حدث خطأ. حاول مرة أخرى أو اتصل بنا.'
        : 'Something went wrong. Please try again or contact us.',
    });
  }
}

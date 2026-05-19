import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

/**
 * Natural-language extraction endpoint used by the chatbot's guided booking
 * flow. Given a free-text user message (and the running conversation), call
 * DeepSeek with a strict JSON-output prompt to pull out:
 *   - name
 *   - email
 *   - phone
 *   - ageGroup        (child | teen | adult | professional)
 *   - course          (the language / programme they're interested in)
 *   - preferredSlots  (free-text human-friendly time descriptions, NOT ISO dates)
 *   - notes           (anything else worth flagging to the admin)
 *
 * Returns whichever fields the AI could confidently extract. Missing fields
 * stay undefined so the chatbot can ask follow-up questions for just those.
 * Falls back gracefully (200 with empty extraction) if DeepSeek is down — the
 * chatbot will then walk the user through the missing fields one at a time.
 */

const schema = z.object({
  message:  z.string().min(1).max(2000),
  /** Optional previously-collected fields so the AI can merge in new info. */
  current:  z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    ageGroup: z.string().optional(),
    course: z.string().optional(),
    preferredSlots: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  locale:   z.enum(['ar', 'en']).optional(),
});

type Extracted = {
  name?: string;
  email?: string;
  phone?: string;
  ageGroup?: 'child' | 'teen' | 'adult' | 'professional';
  course?: string;
  preferredSlots?: string;
  notes?: string;
};

const AGE_VALUES = ['child', 'teen', 'adult', 'professional'] as const;

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 422 });
  const { message, current = {}, locale = 'en' } = parsed.data;

  // Local heuristics first — even if the LLM is unavailable we can still
  // recognise an email and an international phone number deterministically.
  const fallback: Extracted = { ...(current as Extracted) };
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && !fallback.email) fallback.email = emailMatch[0];
  const phoneMatch = message.match(/(\+?\d[\d\s\-()]{6,})/);
  if (phoneMatch && !fallback.phone) fallback.phone = phoneMatch[0].trim();

  // Resolve the DeepSeek key — system_settings first, env var as fallback.
  let apiKey: string | undefined;
  let model = 'deepseek-chat';
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabaseAdmin();
      const { data } = await sb.from('system_settings').select('key, value').in('key', ['deepseek_api_key', 'chatbot_model']);
      for (const r of (data ?? []) as { key: string; value: unknown }[]) {
        if (r.key === 'deepseek_api_key' && typeof r.value === 'string' && r.value) apiKey = r.value;
        if (r.key === 'chatbot_model'   && typeof r.value === 'string' && r.value) model = r.value;
      }
    } catch { /* fall through */ }
  }
  apiKey = apiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: true, extracted: fallback, source: 'heuristics' });
  }

  // Build the extraction prompt. Strict JSON, all keys optional, AI must NOT
  // invent values — only return what it can confidently identify in the text.
  const prompt = `You are a strict information-extraction service. The user is registering for a language course at Rai Language Center. Read the user's free-text message and return ANY of the following fields you can confidently extract. Leave a field OUT of the JSON if it isn't present — DO NOT invent values.

User's message:
"""
${message}
"""

${Object.values(current).some(Boolean) ? `Already-known fields (merge with what you extract, prefer the newer):
${JSON.stringify(current, null, 2)}` : ''}

Return strictly valid JSON matching this exact schema (omit any keys you cannot confidently fill):
{
  "name": "Full name as the user wrote it",
  "email": "lowercased email",
  "phone": "international phone including + and country code if available",
  "ageGroup": "child" | "teen" | "adult" | "professional",
  "course": "english | french | german | russian | spanish | turkish | arabic OR a free-text description if a specific language wasn't named",
  "preferredSlots": "free-text human description of preferred days/times, e.g. 'Tuesday morning, Thursday evening'",
  "notes": "anything else the user mentioned that an admin should see"
}

Important rules:
- The user might write in Arabic OR English. Locale is "${locale}". Mirror the user's language for "notes" / "preferredSlots". Extract email and phone in Latin script regardless.
- "ageGroup" must be one of the four exact values OR omitted.
- Never include placeholder strings like "unknown", "not provided", "n/a". Just omit the field.
- Return ONLY the JSON object, nothing else.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an information-extraction service that only returns strictly valid JSON. Never include prose, never invent fields.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      return NextResponse.json({ ok: true, extracted: fallback, source: 'heuristics-fallback' });
    }
    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? '';
    let parsedAi: Record<string, unknown> = {};
    try { parsedAi = JSON.parse(content); } catch { parsedAi = {}; }

    const out: Extracted = { ...fallback };
    if (typeof parsedAi.name === 'string' && parsedAi.name.trim()) out.name = parsedAi.name.trim();
    if (typeof parsedAi.email === 'string' && /.+@.+\..+/.test(parsedAi.email)) out.email = parsedAi.email.trim().toLowerCase();
    if (typeof parsedAi.phone === 'string' && parsedAi.phone.trim().length >= 5) out.phone = parsedAi.phone.trim();
    if (typeof parsedAi.ageGroup === 'string' && (AGE_VALUES as readonly string[]).includes(parsedAi.ageGroup)) {
      out.ageGroup = parsedAi.ageGroup as Extracted['ageGroup'];
    }
    if (typeof parsedAi.course === 'string' && parsedAi.course.trim()) out.course = parsedAi.course.trim();
    if (typeof parsedAi.preferredSlots === 'string' && parsedAi.preferredSlots.trim()) out.preferredSlots = parsedAi.preferredSlots.trim();
    if (typeof parsedAi.notes === 'string' && parsedAi.notes.trim()) out.notes = parsedAi.notes.trim();

    return NextResponse.json({ ok: true, extracted: out, source: 'deepseek' });
  } catch (e) {
    // Timeout or network error — fall back to whatever the heuristics caught.
    return NextResponse.json({ ok: true, extracted: fallback, source: 'heuristics-fallback', detail: e instanceof Error ? e.message : String(e) });
  } finally {
    clearTimeout(timeoutId);
  }
}

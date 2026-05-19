import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

const schema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

const SYSTEM_PROMPT = `You are a senior English teacher at Rai Language Center in Latakia, acting as a student's PRIVATE 1-on-1 AI tutor.

Your style:
- Warm, patient, encouraging — like a favourite teacher
- Concise (2-5 short paragraphs unless the student asks for a long explanation)
- Concrete: give examples, not just definitions
- Active: ask the student a follow-up question or set a small practice task when it makes sense

What you do:
- Explain grammar, vocabulary, pronunciation, idioms
- Practise conversation: roleplay, ask questions, push the student to respond in English
- Check the student's writing: point out errors clearly, then rewrite the corrected version
- Help with exam strategies (IELTS, TOEFL, Cambridge)
- Suggest practice exercises

Boundaries:
- Speak English unless the student writes in Arabic; if Arabic, you may answer in Arabic AND give the English equivalent
- Never invent specific prices or class schedules — refer those questions to the center: +963 17 2566699
- Never reveal you are an AI unless directly asked; if asked, be honest

You remember the conversation context — refer back to earlier messages when relevant.`;

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 });
  const { conversationId, message } = parsed.data;

  // Auth: only the conversation's owner can post
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase missing' }, { status: 500 });

  const admin = getSupabaseAdmin();
  // Verify ownership
  const { data: conv } = await admin.from('tutor_conversations').select('id,student_id,title').eq('id', conversationId).maybeSingle();
  if (!conv || conv.student_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Load conversation history
  const { data: history } = await admin
    .from('tutor_messages')
    .select('role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Persist user message
  await admin.from('tutor_messages').insert({
    conversation_id: conversationId, role: 'user', content: message,
  });

  // Call DeepSeek with rolling history (keep last 20 messages for context)
  const key = process.env.DEEPSEEK_API_KEY;
  let reply = "I'm having trouble reaching my brain right now. Please try again in a moment, or contact the center at +963 17 2566699.";
  let newTitle: string | null = null;

  if (key) {
    try {
      const recent = (history ?? []).slice(-19);
      const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...recent.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 700,
        }),
      });
      if (resp.ok) {
        const j = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
        reply = j.choices?.[0]?.message?.content?.trim() || reply;
      } else {
        console.warn('[tutor] deepseek non-200', resp.status);
      }

      // If it's the first user message, generate a short title for the conversation
      if (!(history ?? []).some((m) => m.role === 'user')) {
        const titleResp = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You generate concise 3-5 word titles for chat conversations. Return only the title text, no quotes.' },
              { role: 'user', content: `Title this English-tutor conversation that starts with the student saying: "${message.slice(0, 200)}"` },
            ],
            temperature: 0.3,
            max_tokens: 30,
          }),
        });
        if (titleResp.ok) {
          const tj = (await titleResp.json()) as { choices?: { message?: { content?: string } }[] };
          newTitle = (tj.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '').slice(0, 60);
        }
      }
    } catch (e) {
      console.error('[tutor] error', e);
    }
  }

  // Persist assistant reply
  await admin.from('tutor_messages').insert({
    conversation_id: conversationId, role: 'assistant', content: reply,
  });

  // Update conversation title + bump updated_at
  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (newTitle) updates.title = newTitle;
  await admin.from('tutor_conversations').update(updates).eq('id', conversationId);

  return NextResponse.json({ reply, title: newTitle });
}

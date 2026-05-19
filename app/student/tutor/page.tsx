'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Plus, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Conversation = { id: string; title: string; created_at: string };
type Msg = { id: string; role: 'user' | 'assistant'; content: string; created_at: string };

export default function StudentTutorPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadConvs() {
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data } = await sb.from('tutor_conversations').select('*').eq('student_id', u.user.id).order('updated_at', { ascending: false });
    setConversations((data ?? []) as Conversation[]);
    if (!active && data && data.length > 0) setActive(data[0].id);
  }
  useEffect(() => { loadConvs(); }, []);

  async function loadMessages(id: string) {
    const sb = getSupabaseBrowser();
    const { data } = await sb.from('tutor_messages').select('*').eq('conversation_id', id).order('created_at');
    setMessages((data ?? []) as Msg[]);
  }
  useEffect(() => { if (active) loadMessages(active); }, [active]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, sending]);

  async function newConversation() {
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data, error } = await sb.from('tutor_conversations').insert({
      student_id: u.user.id, title: 'New conversation',
    }).select('*').single();
    if (error) { toast.error('Failed'); return; }
    setConversations((c) => [data as Conversation, ...c]);
    setActive((data as Conversation).id);
    setMessages([]);
  }

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation?')) return;
    const sb = getSupabaseBrowser();
    await sb.from('tutor_conversations').delete().eq('id', id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (active === id) { setActive(null); setMessages([]); }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || !active) return;
    setInput('');
    setSending(true);
    // Optimistic UI
    const tmp: Msg = { id: 'tmp', role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, tmp]);
    try {
      const res = await fetch('/api/student/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId: active, message: text }),
      });
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      // Refresh messages from server (they'll have IDs)
      await loadMessages(active);
      // If first reply, update sidebar title from server
      if (json.title) {
        setConversations((c) => c.map((x) => x.id === active ? { ...x, title: json.title } : x));
      }
    } catch {
      toast.error('Could not reach the tutor. Try again.');
      // Roll back optimistic msg
      setMessages((m) => m.filter((x) => x.id !== 'tmp'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <Sparkles className="h-7 w-7 text-[var(--color-gold)]" /> AI Tutor
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Your private English teacher. Ask anything, get a personalized answer.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-sm bg-[var(--color-cream)] p-3 ring-1 ring-[var(--color-line)]">
          <button onClick={newConversation} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
            <Plus className="h-4 w-4" /> New chat
          </button>
          <div className="mt-3 flex flex-col gap-1">
            {conversations.map((c) => (
              <div key={c.id} className={`group flex items-center gap-2 rounded-sm px-2 py-2 text-sm transition ${active === c.id ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : 'hover:bg-[var(--color-ivory)]'}`}>
                <button onClick={() => setActive(c.id)} className="flex-1 truncate text-start">{c.title}</button>
                <button onClick={() => deleteConversation(c.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-[var(--color-rose)]" /></button>
              </div>
            ))}
            {conversations.length === 0 && <div className="px-2 py-4 text-center text-xs text-[var(--color-ink-soft)]">No chats yet</div>}
          </div>
        </aside>

        <main className="flex h-[70vh] flex-col rounded-sm bg-[var(--color-cream)] ring-1 ring-[var(--color-line)]">
          {!active ? (
            <div className="grid flex-1 place-items-center text-sm text-[var(--color-ink-soft)]">Start a new chat to begin.</div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user' ? 'self-end bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'self-start bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)]'
                        }`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {m.content}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {sending && (
                    <div className="self-start inline-flex items-center gap-1.5 rounded-2xl bg-[var(--color-ivory)] px-4 py-2.5 ring-1 ring-[var(--color-line)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                  {messages.length === 0 && !sending && (
                    <div className="mx-auto mt-8 max-w-md text-center text-sm text-[var(--color-ink-soft)]">
                      <Sparkles className="mx-auto h-8 w-8 text-[var(--color-gold)]" />
                      <p className="mt-3">Hi! I&apos;m your private AI English teacher. Ask me to explain a grammar rule, practise conversation, or check your writing.</p>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-[var(--color-line)] p-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…"
                  className="flex-1 rounded-full bg-[var(--color-ivory)] px-4 py-2.5 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
                <button type="submit" disabled={!input.trim() || sending} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

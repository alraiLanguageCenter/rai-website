'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export function Chatbot() {
  const locale = useLocale() as 'ar' | 'en';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greeting message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            locale === 'ar'
              ? 'مرحباً! أنا نهى، المساعدة الافتراضية لمركز الراعي للغات. كيف يمكنني مساعدتك اليوم؟ 😊'
              : "Hi! I'm Nouha, the AI assistant for Rai Language Center. How can I help you today? 😊",
        },
      ]);
    }
  }, [open, locale]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: next.slice(-10).slice(0, -1),
          locale,
        }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: json.reply || (locale === 'ar' ? 'حدث خطأ.' : 'Something went wrong.') },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: locale === 'ar' ? 'تعذّر الاتصال.' : "Couldn't reach the server." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 220, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 end-6 z-[80] inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--color-rlc-800)] shadow-[0_18px_40px_-12px_rgba(8,57,34,0.6)] ring-2 ring-[var(--color-gold)]"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} className="text-[var(--color-cream)]">
              <X className="h-7 w-7" />
            </motion.span>
          ) : (
            <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full w-full items-center justify-center">
              {/* Use the Nouha caricature if present, otherwise fall back to a chat icon */}
              <img
                src="/brand/chatbot-avatar.png"
                onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                alt=""
                className="h-full w-full object-cover"
              />
              <MessageCircle className="absolute h-7 w-7 text-[var(--color-gold)]" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Idle pulse */}
        {!open && (
          <motion.span
            aria-hidden
            className="absolute -inset-1 rounded-full border-2 border-[var(--color-gold)]/50"
            animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 end-6 z-[79] flex max-h-[80vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl bg-[var(--color-cream)] shadow-[0_30px_80px_-20px_rgba(8,57,34,0.5)] ring-1 ring-[var(--color-line)] sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-[var(--color-rlc-800)] px-4 py-3 text-[var(--color-cream)]">
              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[var(--color-gold)]/20 ring-1 ring-[var(--color-gold)]/50">
                <img
                  src="/brand/chatbot-avatar.png"
                  onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">
                  {locale === 'ar' ? 'نهى — مساعدة الراعي' : 'Nouha — Rai Assistant'}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] opacity-80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  {locale === 'ar' ? 'متاحة الآن' : 'Online now'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'self-end bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
                          : 'self-start bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)]'
                      }`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {m.content}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sending && (
                  <div className="self-start inline-flex items-center gap-1.5 rounded-2xl bg-[var(--color-ivory)] px-3.5 py-2.5 ring-1 ring-[var(--color-line)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-cream)] p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message…'}
                className="flex-1 rounded-full bg-[var(--color-ivory)] px-4 py-2.5 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4 rtl:rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

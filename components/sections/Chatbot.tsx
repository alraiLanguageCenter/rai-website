'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, BookOpen, Calendar, Compass, ArrowRight } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const AVATAR_SRC = '/brand/chatbot-character.png';

export function Chatbot() {
  const locale = useLocale() as 'ar' | 'en';
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  // Show the "Let me help you" floating call-out once after the page loads so
  // visitors discover the chat — and dismiss it once they've opened it.
  const [showCallout, setShowCallout] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Surface the call-out 3s after mount, hide it when chat opens.
  useEffect(() => {
    const id = setTimeout(() => setShowCallout(true), 3000);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => { if (open) setShowCallout(false); }, [open]);

  // Initial greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            locale === 'ar'
              ? "مرحباً! أنا نهى، المساعدة الذكية لمركز الراعي للغات. يمكنني أن أساعدك في:\n\n• معلومات عن الدورات (إنجليزي، فرنسي، ألماني، روسي وأكثر)\n• مواعيد الدورات وأوقات الامتحانات\n• الأسعار، طرق التسجيل، والمواقع\n• حجز اختبار تحديد مستوى مجاني\n\nما الذي تبحث عنه اليوم؟ 😊"
              : "Hi! I'm Nouha, the AI assistant for Rai Language Center. I can help you with:\n\n• Course info (English, French, German, Russian & more)\n• Class schedules and exam dates\n• Pricing, registration, and locations\n• Booking a free placement test\n\nWhat would you like to know? 😊",
        },
      ]);
    }
  }, [open, locale, messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function sendText(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      // Client-side timeout so a slow upstream doesn't leave the UI hanging.
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 45_000);

      let res: Response;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: next.slice(-10).slice(0, -1),
            locale,
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(tid);
      }

      const json = (await res.json().catch(() => null)) as { reply?: string } | null;
      // The server always returns 200 with a `{ reply }` body — even when the
      // upstream LLM is down, the route ships a friendly fallback. So we treat
      // anything OK + a non-empty reply as a successful exchange.
      if (res.ok && json?.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: json.reply! }]);
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: locale === 'ar'
            ? 'تعذّر الوصول للخادم. حاول مرة أخرى بعد قليل أو تواصل معنا على +٩٦٣ ١٧ ٢٥٦٦٦٩٩.'
            : "I couldn't reach the server. Please try again in a moment or call us at +963 17 2566699.",
        }]);
      }
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: aborted
          ? (locale === 'ar' ? 'استغرق الرد وقتاً طويلاً. حاول مرة أخرى.' : 'The reply took too long. Try again.')
          : (locale === 'ar' ? 'تعذّر الاتصال. تحقق من اتصالك بالإنترنت.' : "Couldn't connect. Check your internet connection."),
      }]);
    } finally {
      setSending(false);
    }
  }

  // Pre-baked suggestion chips. Visible until the first user message.
  const suggestions: { label: string; question: string; Icon: React.ComponentType<{ className?: string }> }[] = locale === 'ar'
    ? [
        { label: 'الدورات', question: 'ما الدورات المتوفرة؟', Icon: BookOpen },
        { label: 'المواعيد', question: 'ما مواعيد الدورات؟', Icon: Calendar },
        { label: 'تحديد المستوى', question: 'كيف أحجز اختبار تحديد المستوى المجاني؟', Icon: Sparkles },
        { label: 'الموقع والاتصال', question: 'أين المركز وكيف أتواصل؟', Icon: Compass },
      ]
    : [
        { label: 'Browse courses', question: 'What courses do you offer?', Icon: BookOpen },
        { label: 'Class schedule', question: 'When are the upcoming classes?', Icon: Calendar },
        { label: 'Free placement test', question: 'How do I book the free placement test?', Icon: Sparkles },
        { label: 'Location & contact', question: 'Where are you located and how do I contact you?', Icon: Compass },
      ];

  const showSuggestions = messages.length <= 1 && !sending;

  return (
    <>
      {/* === Floating launcher === */}
      <div className="pointer-events-none fixed bottom-6 end-6 z-[80] flex items-center gap-3">
        {/* "Let me help you" call-out — dismissible, never blocks the click */}
        <AnimatePresence>
          {!open && showCallout && (
            <motion.div
              key="callout"
              initial={{ opacity: 0, x: 12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative hidden items-center gap-2 rounded-full bg-[var(--color-cream)] py-2.5 ps-3 pe-4 text-sm font-medium text-[var(--color-rlc-900)] shadow-[0_18px_40px_-16px_rgba(8,57,34,0.45)] ring-1 ring-[var(--color-gold)]/40 sm:inline-flex"
            >
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>{locale === 'ar' ? '👋 دعيني أساعدك!' : "👋 Let me help you!"}</span>
              <button
                onClick={() => setShowCallout(false)}
                aria-label="Dismiss"
                className="ms-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-line)]/50"
              >
                <X className="h-3 w-3" />
              </button>
              {/* Speech-bubble tail pointing at the launcher */}
              <span aria-hidden className="absolute -end-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-[var(--color-cream)] ring-1 ring-[var(--color-gold)]/40" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launcher button */}
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close chat' : 'Open chat'}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 220, damping: 18 }}
          whileHover={reduced ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto relative inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--color-rlc-800)] shadow-[0_18px_40px_-12px_rgba(8,57,34,0.6)] ring-2 ring-[var(--color-gold)]"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                className="grid h-full w-full place-items-center text-[var(--color-cream)]"
              >
                <X className="h-7 w-7" />
              </motion.span>
            ) : (
              <motion.span
                key="avatar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid h-full w-full place-items-center"
              >
                <Avatar size={64} className="h-full w-full ring-0" />
              </motion.span>
            )}
          </AnimatePresence>
          {/* Idle pulse + glow when closed */}
          {!open && !reduced && (
            <>
              <motion.span
                aria-hidden
                className="absolute -inset-1 rounded-full border-2 border-[var(--color-gold)]/50"
                animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                aria-hidden
                className="absolute -inset-3 rounded-full bg-[var(--color-gold)]/15 blur-md"
                animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}
        </motion.button>
      </div>

      {/* === Chat panel === */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 end-4 z-[79] flex max-h-[min(80vh,640px)] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl bg-[var(--color-cream)] shadow-[0_30px_80px_-20px_rgba(8,57,34,0.5)] ring-1 ring-[var(--color-line)] sm:end-6 sm:w-96"
          >
            {/* Header — Nouha portrait + status */}
            <div className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-[var(--color-rlc-800)] via-[var(--color-rlc-700)] to-[var(--color-rlc-900)] px-4 py-3.5 text-[var(--color-cream)]">
              {/* Animated gold sweep across header */}
              {!reduced && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: 'linear-gradient(110deg, transparent 35%, rgba(201,162,74,0.35) 50%, transparent 65%)',
                  }}
                  initial={{ x: '-110%' }}
                  animate={{ x: '110%' }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                />
              )}
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-gold)]/20 ring-2 ring-[var(--color-gold)]/60">
                <Avatar size={48} className="h-full w-full ring-0" />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight">
                  {locale === 'ar' ? 'نهى — مساعدة الراعي' : 'Nouha — Rai Assistant'}
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] opacity-85">
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-300">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/70" />
                  </span>
                  {locale === 'ar' ? 'متاحة الآن' : 'Online now'}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="relative rounded-full p-1.5 transition hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={m.role === 'user'
                        ? 'flex justify-end'
                        : 'flex items-end gap-2'
                      }
                    >
                      {m.role === 'assistant' && (
                        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-[var(--color-gold)]/40">
                          <Avatar size={32} className="h-full w-full ring-0" />
                        </span>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'rounded-br-sm bg-[var(--color-rlc-800)] text-[var(--color-cream)] rtl:rounded-bl-sm rtl:rounded-br-2xl'
                            : 'rounded-bl-sm bg-[var(--color-ivory)] text-[var(--color-ink)] ring-1 ring-[var(--color-line)] rtl:rounded-br-sm rtl:rounded-bl-2xl'
                        }`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sending && (
                  <div className="flex items-end gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-[var(--color-gold)]/40">
                      <Avatar size={32} className="h-full w-full ring-0" />
                    </span>
                    <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[var(--color-ivory)] px-3.5 py-2.5 ring-1 ring-[var(--color-line)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rlc-700)] animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Suggestion chips — only before first user message */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-1 grid gap-2 sm:grid-cols-2"
                  >
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={s.label}
                        onClick={() => sendText(s.question)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.07, duration: 0.35 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-2 text-start text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60 hover:shadow-[0_8px_18px_-10px_rgba(8,57,34,0.4)]"
                      >
                        <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                          <s.Icon className="h-3 w-3" />
                        </span>
                        <span className="flex-1 truncate">{s.label}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100 rtl:rotate-180" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendText(); }}
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-10px_rgba(8,57,34,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
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

/* -------------------- Avatar (image with safe icon fallback) -------------------- */

function Avatar({ size = 32, className = '' }: { size?: number; className?: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <span className={`grid place-items-center rounded-full bg-[var(--color-gold)]/25 text-[var(--color-gold)] ${className}`}>
        <MessageCircle style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={AVATAR_SRC}
      alt="Nouha — Rai Assistant"
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

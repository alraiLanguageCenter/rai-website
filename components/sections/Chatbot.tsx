'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, BookOpen, Calendar, Compass, ArrowRight,
  CalendarPlus, GraduationCap,
} from 'lucide-react';
import { MarkdownLite } from '@/components/motion/MarkdownLite';

type Msg = { role: 'user' | 'assistant'; content: string };

/**
 * Conversational mode.
 *   - 'chat'           : normal Q&A through the LLM
 *   - 'booking-collect': free-text booking flow — Nouha asks for everything in
 *                        one message, /api/chat-extract pulls structured
 *                        fields out, and any missing ones are asked for
 *                        conversationally before /api/contact is auto-called.
 */
type Mode = 'chat' | 'booking-collect';

type BookingDraft = {
  name?: string;
  email?: string;
  phone?: string;
  ageGroup?: 'child' | 'teen' | 'adult' | 'professional';
  course?: string;
  preferredSlots?: string;
  notes?: string;
};

const REQUIRED_FIELDS: (keyof BookingDraft)[] = ['name', 'email', 'phone'];
const CENTER_WHATSAPP_DISPLAY = '+963 966 466699';
const CENTER_WHATSAPP_AR_DIGITS = '+٩٦٣ ٩٦٦ ٤٦٦٦٩٩';

const AVATAR_SRC = '/brand/chatbot-character.png';

export function Chatbot() {
  const locale = useLocale() as 'ar' | 'en';
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({});
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
              ? "مرحباً! أنا نهى، المساعدة الذكية لمركز الراعي للغات.\n\nيمكنني أن أساعدك مباشرة في:\n• حجز جلسة تقييم — سأملأ النموذج عنك\n• بدء اختبار تحديد المستوى الآن\n• معلومات عن الدورات والمواعيد والأسعار\n\nاختر إجراءً سريعاً من الأسفل أو اكتب سؤالك. 😊"
              : "Hi! I'm Nouha, the AI assistant for Rai Language Center.\n\nI can help you directly with:\n• Booking an assessment — I'll fill the form for you\n• Starting the AI placement test right now\n• Course info, schedules, and pricing\n\nPick a quick action below or type your question. 😊",
        },
      ]);
    }
  }, [open, locale, messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  /* -------------------- helpers -------------------- */

  function pushAssistant(content: string) {
    setMessages((m) => [...m, { role: 'assistant', content }]);
  }

  /** Scroll smoothly to a section by id, with header offset. */
  function scrollToSection(id: string) {
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (!el) {
      if (typeof window !== 'undefined') window.location.hash = id;
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // (legacy per-field validators removed — NL extraction handles email/phone now)

  /* -------------------- guided flows -------------------- */

  /** Begin the booking flow. One question: "share everything in one message". */
  function startBookingFlow() {
    setMode('booking-collect');
    setBookingDraft({});
    setMessages((m) => [
      ...m,
      { role: 'user', content: locale === 'ar' ? 'أريد حجز جلسة تقييم' : 'I want to book an assessment' },
      {
        role: 'assistant',
        content: locale === 'ar'
          ? 'بالتأكيد! 🌿 شاركني في رسالة واحدة:\n\n• **اسمك الكامل**\n• **بريدك الإلكتروني**\n• **رقم الواتساب** مع رمز الدولة\n• الفئة العمرية (طفل / يافع / بالغ / مهني)\n• الدورة التي تهمّك (إنجليزي، فرنسي، ...)\n• أوقاتك المفضّلة (مثلاً: الثلاثاء صباحاً، الخميس مساءً)\n\nسأملأ النموذج وأرسل طلبك للفريق فور استلام بياناتك. 💚'
          : "Wonderful! 🌿 In one message please share:\n\n• **Your full name**\n• **Email**\n• **WhatsApp number** with country code\n• Age group (child / teen / adult / professional)\n• Course of interest (English, French, …)\n• Preferred days/times (e.g. Tuesday morning, Thursday evening)\n\nI'll fill the form and send your request to our team as soon as I have your details. 💚",
      },
    ]);
  }

  /** Kick off the AI placement test now: scroll + dispatch event + acknowledge. */
  function startAssessmentNow() {
    scrollToSection('assess');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rai:start-assessment'));
    }
    setMessages((m) => [
      ...m,
      { role: 'user', content: locale === 'ar' ? 'ابدأ اختبار تحديد المستوى الآن' : 'Start the placement test now' },
      {
        role: 'assistant',
        content: locale === 'ar'
          ? 'يبدأ اختبارك الآن — حظاً موفقاً! أنا هنا إن احتجت أي مساعدة. 🍀'
          : "Your test is starting now — best of luck! I'm here if you need anything. 🍀",
      },
    ]);
    // Politely close the chat panel a moment later so the user can focus on
    // the assessment without the chat covering it.
    setTimeout(() => setOpen(false), 1400);
  }

  /** Submit the collected booking to /api/contact (which already saves the lead
   *  and notifies the admin inbox). On success, close the booking flow and
   *  confirm in chat with the centre WhatsApp number. */
  async function submitBooking(draft: BookingDraft) {
    const isAr = locale === 'ar';
    pushAssistant(isAr ? '...جارٍ إرسال طلبك إلى الفريق' : 'Sending your request to the team…');
    try {
      const payload = {
        locale,
        website: '',
        name: draft.name ?? '',
        email: draft.email ?? '',
        phone: draft.phone ?? '',
        course: deriveCourseSlug(draft.course),
        message: [
          `[Chatbot booking — via Nouha]`,
          draft.course && `Course of interest: ${draft.course}`,
          draft.ageGroup && `Age group: ${draft.ageGroup}`,
          draft.preferredSlots && `Preferred slots: ${draft.preferredSlots}`,
          draft.notes && `Notes: ${draft.notes}`,
        ].filter(Boolean).join('\n'),
      };
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMode('chat');
      setBookingDraft({});
      const whatsapp = isAr ? CENTER_WHATSAPP_AR_DIGITS : CENTER_WHATSAPP_DISPLAY;
      pushAssistant(
        isAr
          ? `تمّ إرسال طلبك بنجاح! ✨\n\n**ملخّص بياناتك:**\n• الاسم: ${draft.name}\n• البريد: ${draft.email}\n• الهاتف: ${draft.phone}${draft.course ? `\n• الدورة: ${draft.course}` : ''}${draft.ageGroup ? `\n• الفئة: ${draft.ageGroup}` : ''}${draft.preferredSlots ? `\n• الأوقات المفضّلة: ${draft.preferredSlots}` : ''}\n\nسيتواصل أحد أعضاء فريقنا معك قريباً عبر البريد أو الواتساب لتأكيد التفاصيل.\n\n📱 رقم الواتساب لدينا: **${whatsapp}**`
          : `Your request was sent successfully! ✨\n\n**Summary of what I sent:**\n• Name: ${draft.name}\n• Email: ${draft.email}\n• Phone: ${draft.phone}${draft.course ? `\n• Course: ${draft.course}` : ''}${draft.ageGroup ? `\n• Age group: ${draft.ageGroup}` : ''}${draft.preferredSlots ? `\n• Preferred slots: ${draft.preferredSlots}` : ''}\n\nOne of our team will reach out to you shortly by email or WhatsApp to confirm the details.\n\n📱 Our WhatsApp number: **${whatsapp}**`
      );
    } catch (err) {
      pushAssistant(
        isAr
          ? `عذراً، تعذّر إرسال طلبك للخادم. يمكنك التواصل معنا مباشرة عبر الواتساب: **${CENTER_WHATSAPP_AR_DIGITS}** أو الاتصال على **+٩٦٣ ١٧ ٢٥٦٦٦٩٩**.`
          : `Sorry — I couldn't send your request right now. You can reach us directly on WhatsApp: **${CENTER_WHATSAPP_DISPLAY}** or by phone **+963 17 2566699**.`
      );
      console.error('[chatbot] booking submit failed', err);
    }
  }

  /** While in 'booking-collect' mode, each user message is passed to
   *  /api/chat-extract; missing required fields are asked for one at a time;
   *  when all required fields are present the booking auto-submits. */
  async function handleBookingNL(userText: string) {
    setMessages((m) => [...m, { role: 'user', content: userText }]);
    try {
      const res = await fetch('/api/chat-extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: userText, current: bookingDraft, locale }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; extracted?: BookingDraft };
      const merged: BookingDraft = { ...bookingDraft, ...(json.extracted ?? {}) };
      setBookingDraft(merged);

      const missing = REQUIRED_FIELDS.filter((k) => !merged[k]);
      if (missing.length === 0) {
        // We have name + email + phone — go ahead and submit.
        await submitBooking(merged);
        return;
      }

      // Ask for the next missing field. Keep the message short and friendly.
      const ask = missingPrompt(missing[0], locale);
      pushAssistant(ask);
    } catch (err) {
      console.error('[chatbot] extract failed', err);
      pushAssistant(locale === 'ar'
        ? 'تعذّر تحليل رسالتك. ممكن تشاركني اسمك وبريدك ورقم هاتفك مرة أخرى؟'
        : "I couldn't parse your message. Could you share your name, email, and phone again?");
    }
  }

  /* -------------------- main send -------------------- */

  async function sendText(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;

    // 1) If we're inside the booking flow, route to the NL extractor.
    if (mode === 'booking-collect') {
      setInput('');
      setSending(true);
      try {
        await handleBookingNL(text);
      } finally {
        setSending(false);
      }
      return;
    }

    // 2) Simple intent detection: a free-form "I want to book" / "احجز" /
    //    "start assessment" / "ابدأ التقييم" should trigger the right action
    //    rather than going to the LLM.
    const lower = text.toLowerCase();
    if (/\bbook\b|\bassessment\b|\breserve\b|\bsign\s*up\b|احجز|حجز|تقييم|سجّل|سجل/i.test(lower) && !/^how|^when|^where|^كيف|^متى|^أين/.test(lower)) {
      setInput('');
      startBookingFlow();
      return;
    }
    if (/start.*placement|start.*test|begin.*test|placement test|level test|ابدأ.*اختبار|اختبار المستوى|تحديد المستوى/i.test(lower)) {
      setInput('');
      startAssessmentNow();
      return;
    }

    // 3) Otherwise, normal LLM chat.
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

  /* -------------------- chips -------------------- */

  // Two primary actions — these *do* something on the website, they don't
  // just ask Nouha a question.
  const actions: { label: string; sublabel: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void }[] = locale === 'ar'
    ? [
        { label: 'احجز جلسة تقييم', sublabel: 'سأملأ النموذج معك', Icon: CalendarPlus, onClick: startBookingFlow },
        { label: 'ابدأ اختبار المستوى', sublabel: 'الاختبار يبدأ فوراً', Icon: GraduationCap, onClick: startAssessmentNow },
      ]
    : [
        { label: 'Book an assessment', sublabel: "I'll fill the form for you", Icon: CalendarPlus, onClick: startBookingFlow },
        { label: 'Start placement test', sublabel: 'Begins right away', Icon: GraduationCap, onClick: startAssessmentNow },
      ];

  // Pre-baked LLM-question chips. Visible until the first user message.
  const suggestions: { label: string; question: string; Icon: React.ComponentType<{ className?: string }> }[] = locale === 'ar'
    ? [
        { label: 'الدورات', question: 'ما الدورات المتوفرة؟', Icon: BookOpen },
        { label: 'المواعيد', question: 'ما مواعيد الدورات؟', Icon: Calendar },
        { label: 'الأسعار', question: 'كيف تتم معرفة الأسعار وطريقة الدفع؟', Icon: Sparkles },
        { label: 'الموقع', question: 'أين المركز وكيف أتواصل؟', Icon: Compass },
      ]
    : [
        { label: 'Browse courses', question: 'What courses do you offer?', Icon: BookOpen },
        { label: 'Class schedule', question: 'When are the upcoming classes?', Icon: Calendar },
        { label: 'Pricing', question: 'How do prices and payment work?', Icon: Sparkles },
        { label: 'Location', question: 'Where are you located?', Icon: Compass },
      ];

  const showSuggestions = messages.length <= 1 && !sending && mode === 'chat';

  // Placeholder text adapts when we're in the booking flow.
  const placeholder = mode === 'booking-collect'
    ? (locale === 'ar' ? 'اكتب اسمك وبريدك وهاتفك وأوقاتك المفضّلة…' : 'Type your name, email, phone, preferred times…')
    : (locale === 'ar' ? 'اكتب رسالة...' : 'Type a message…');

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
                {/* Quiet ring-pulse — softer than the launcher's, sits behind the avatar */}
                {!reduced && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[var(--color-gold)]/70"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.65, 0, 0.65] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight tracking-tight">
                  {locale === 'ar' ? 'نهى — مساعدة الراعي' : 'Nouha — Rai Assistant'}
                </div>
                {/* Status pill — slightly larger, with a clear dot and a thin
                    background so the text doesn't blend into the green header */}
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cream)]/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.14em]">
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-300">
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-emerald-300"
                      animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </span>
                  <span className="uppercase">
                    {mode === 'chat'
                      ? (locale === 'ar' ? 'متاحة' : 'Online')
                      : (locale === 'ar' ? 'تعبئة الحجز' : 'Filling booking')}
                  </span>
                </span>
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
                      >
                        <MarkdownLite text={m.content} />
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

                {/* Action + suggestion chips — only before first user message and only outside guided mode */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-1 grid gap-2"
                  >
                    {/* PRIMARY actions (visually distinct) — they DO things on the site */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {actions.map((a, i) => (
                        <motion.button
                          key={a.label}
                          onClick={a.onClick}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.07, duration: 0.35 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--color-rlc-800)] to-[var(--color-rlc-900)] px-3 py-2.5 text-start text-xs font-semibold text-[var(--color-cream)] shadow-[0_10px_22px_-12px_rgba(8,57,34,0.5)] transition hover:from-[var(--color-rlc-700)] hover:to-[var(--color-rlc-800)] hover:shadow-[0_14px_28px_-12px_rgba(8,57,34,0.6)]"
                        >
                          <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-[var(--color-rlc-900)]">
                            <a.Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex flex-col">
                            <span>{a.label}</span>
                            <span className="text-[0.65rem] font-normal opacity-80">{a.sublabel}</span>
                          </span>
                          <ArrowRight className="ms-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                        </motion.button>
                      ))}
                    </div>

                    {/* SECONDARY question chips */}
                    <div className="mt-1 grid gap-2 sm:grid-cols-2">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={s.label}
                          onClick={() => sendText(s.question)}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                          whileTap={{ scale: 0.97 }}
                          className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-2 text-start text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60"
                        >
                          <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                            <s.Icon className="h-3 w-3" />
                          </span>
                          <span className="flex-1 truncate">{s.label}</span>
                          <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100 rtl:rotate-180" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* "Cancel guided flow" escape hatch — visible whenever we're collecting form info. */}
                {mode !== 'chat' && (
                  <button
                    onClick={() => {
                      setMode('chat');
                      pushAssistant(locale === 'ar' ? 'حسناً، توقّفت عن تعبئة النموذج. أيّ سؤال آخر؟' : "Okay, I've stopped filling the form. Anything else?");
                    }}
                    className="mx-auto mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-ivory)] px-3 py-1 text-[0.65rem] font-medium text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]"
                  >
                    <X className="h-3 w-3" /> {locale === 'ar' ? 'إلغاء التعبئة' : 'Cancel fill-in'}
                  </button>
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
                placeholder={placeholder}
                type="text"
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

/* -------------------- NL booking helpers -------------------- */

/**
 * Returns a friendly follow-up question asking the user for one specific
 * missing field. Used after partial extraction.
 */
function missingPrompt(field: keyof BookingDraft, locale: 'ar' | 'en'): string {
  const isAr = locale === 'ar';
  switch (field) {
    case 'name':  return isAr ? 'ما اسمك الكامل؟ 🌿' : "What's your full name? 🌿";
    case 'email': return isAr ? 'وما بريدك الإلكتروني؟' : "And your email address?";
    case 'phone': return isAr ? 'وما رقم الواتساب لديك (مع رمز الدولة)؟' : "And your WhatsApp number (with country code)?";
    default: return isAr ? 'ممكن تخبرني بالمزيد؟' : 'Could you share a bit more?';
  }
}

/** Map a free-text "course" string from the NL extractor to one of the slugs
 *  the existing /api/contact schema accepts. */
function deriveCourseSlug(input?: string): 'kids' | 'adults' | 'exams' | 'business' | 'other' {
  if (!input) return 'other';
  const s = input.toLowerCase();
  if (/(kid|child|teen|young|أطفال|طفل|يافع)/.test(s)) return 'kids';
  if (/(toefl|ielts|cambridge|delf|dele|goethe|exam|امتحان|تحضير)/.test(s)) return 'exams';
  if (/(business|professional|work|أعمال|مهني)/.test(s)) return 'business';
  if (/(general|adult|conversation|بالغ|محادثة|عام)/.test(s)) return 'adults';
  // Treat plain language names as 'adults' (the catch-all general track).
  if (/(english|french|german|russian|spanish|turkish|arabic|إنجليز|فرنس|ألمان|روس|إسبان|ترك|عرب)/.test(s)) return 'adults';
  return 'other';
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Send, Mic, Square, PenLine, ArrowRight, Check, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

type Q = {
  id: string;
  prompt_en: string; prompt_ar: string;
  options: { en: string; ar: string }[];
  correct_idx: number;
  difficulty: number;
  skill_tag: string | null;
};

type Stage = 'intro' | 'mcq' | 'speak' | 'write' | 'capture' | 'sending' | 'sent';

const READING_PASSAGE =
  "Learning a new language is one of the most rewarding journeys a person can take. " +
  "It opens doors to new cultures, careers, and friendships across the world. " +
  "With patience, practice, and the right teacher, anyone can become a confident speaker.";

const WRITING_PROMPT = {
  en: 'Write a short paragraph (4–6 sentences) describing why you want to learn English and one goal you hope to achieve.',
  ar: 'اكتب فقرة قصيرة (٤–٦ جمل) بالإنجليزية تشرح فيها لماذا تريد تعلّم الإنجليزية وهدفاً واحداً تأمل في تحقيقه.',
};

const TARGET_QUESTIONS = 25;

// Minimal Web Speech API types — present in browsers, missing in standard TS lib.
interface SpeechResultAlt { transcript: string }
interface SpeechResult { 0: SpeechResultAlt; isFinal: boolean }
interface SpeechResultList { length: number; [i: number]: SpeechResult }
interface SpeechRecognitionEvent { resultIndex: number; results: SpeechResultList }
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function Assessment() {
  const t = useTranslations('assess');
  const locale = useLocale() as 'ar' | 'en';

  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [stage, setStage] = useState<Stage>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  // Speech
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Writing
  const [writtenText, setWrittenText] = useState('');

  // Capture form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Load 25 random questions
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/quiz/questions?count=${TARGET_QUESTIONS}`).then((x) => x.json());
        setQuestions(Array.isArray(r.questions) ? r.questions : []);
      } catch {
        setQuestions([]);
      }
    })();
  }, []);

  // Init Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript + ' ';
      }
      setTranscript(t.trim());
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  function startRec() {
    if (!recognitionRef.current) return;
    setTranscript('');
    try { recognitionRef.current.start(); setIsRecording(true); } catch { /* already started */ }
  }
  function stopRec() {
    try { recognitionRef.current?.stop(); } catch { /* not started */ }
    setIsRecording(false);
  }

  // Computed
  const total = questions?.length ?? 0;
  const score = answers.reduce((acc, a, i) => acc + (questions && a === questions[i]?.correct_idx ? 1 : 0), 0);

  function start() {
    setIdx(0); setAnswers([]); setTranscript(''); setWrittenText('');
    setName(''); setEmail(''); setPhone('');
    setStage('mcq');
  }

  /**
   * The chatbot (or any other widget) can fire `rai:start-assessment` to
   * jump straight into the placement test. We only honour it if questions
   * have already loaded — otherwise the call would silently no-op. The
   * handler waits for questions to be ready and then fires `start()` once.
   */
  const startPendingRef = useRef(false);
  useEffect(() => {
    function onStartRequest() {
      if (questions && questions.length > 0) {
        start();
      } else {
        startPendingRef.current = true;
      }
    }
    window.addEventListener('rai:start-assessment', onStartRequest);
    return () => window.removeEventListener('rai:start-assessment', onStartRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // If a start was requested before the questions arrived, kick it off now.
  useEffect(() => {
    if (startPendingRef.current && questions && questions.length > 0) {
      startPendingRef.current = false;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  function answerMcq(opt: number) {
    if (!questions) return;
    const next = [...answers]; next[idx] = opt;
    setAnswers(next);
    if (idx < total - 1) setIdx(idx + 1);
    else setStage('speak');
  }

  function nextFromSpeak() { stopRec(); setStage('write'); }
  function nextFromWrite() { setStage('capture'); }

  async function submitAll() {
    if (!questions || !name.trim() || !email.trim() || !phone.trim()) {
      toast.error(locale === 'ar' ? 'يرجى تعبئة الاسم والبريد ورقم الهاتف.' : 'Please fill in name, email, and phone.');
      return;
    }
    setStage('sending');
    try {
      // Estimate provisional level from MCQ for the analysis prompt
      const pct = total === 0 ? 0 : (score / total);
      const provisional =
        pct >= 0.85 ? 'C1' :
        pct >= 0.7  ? 'B2' :
        pct >= 0.55 ? 'B1' :
        pct >= 0.4  ? 'A2' : 'A1';

      // Ensure we always have at least one answer in the payload (server requires .min(1)).
      // If the user somehow reaches capture without completing MCQs (e.g. via a future
      // skip path), synthesise a single "not answered" row from the first question.
      const filledAnswers = answers.length > 0 ? answers : (questions.length > 0 ? [0] : []);
      const mcqAnswers = filledAnswers.map((selectedIndex, i) => ({
        questionId: questions[i].id,
        selectedIndex,
        correct: selectedIndex === questions[i].correct_idx,
        skillTag: questions[i].skill_tag ?? 'grammar',
        difficulty: questions[i].difficulty ?? 1,
      }));

      // Client-side timeout — if the server takes more than 60s we surface a clear error.
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 60_000);

      let res: Response;
      try {
        res = await fetch('/api/assessment/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            locale,
            level: provisional,
            score,
            answers: mcqAnswers,
            speech: { reference: READING_PASSAGE, transcript: transcript || '' },
            writing: { prompt: WRITING_PROMPT.en, text: writtenText || '' },
            sendEmail: true,
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(tid);
      }

      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailed?: boolean;
        emailError?: string | null;
        analysisError?: string | null;
        error?: string;
      };

      if (!res.ok || payload.ok === false) {
        throw new Error(payload.error || `HTTP ${res.status}`);
      }

      // Success path. Show a tailored toast based on whether the email actually
      // landed: even when the email provider has trouble, the attempt is logged.
      setStage('sent');
      if (payload.emailed) {
        toast.success(t('sent'));
      } else {
        toast.success(
          locale === 'ar'
            ? 'تم تسجيل نتيجتك. سيتواصل معك الفريق قريباً.'
            : 'Your result has been recorded. Our team will reach out shortly.',
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? (locale === 'ar' ? 'استغرق الإرسال وقتاً طويلاً. حاول مرة أخرى.' : 'The send took too long. Please try again.')
          : (locale === 'ar' ? 'تعذّر الإرسال. تأكّد من الاتصال بالإنترنت وحاول مرة أخرى.' : 'Could not send. Check your connection and try again.');
      console.error('[assessment] submit failed', err);
      toast.error(msg);
      setStage('capture');
    }
  }

  function restart() {
    stopRec();
    setStage('intro');
    setIdx(0); setAnswers([]); setTranscript(''); setWrittenText('');
    setName(''); setEmail(''); setPhone('');
  }

  const q = questions && questions[idx];

  return (
    <Section id="assess" tone="ivory">
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />{t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="mt-5 max-w-2xl body-lg text-[var(--color-ink-soft)]">{t('lede')}</p>
      </Reveal>

      <div className="mt-10 rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)] sm:mt-12 sm:p-6 lg:p-12 min-h-[460px]">
        <AnimatePresence mode="wait">
          {/* ───────────────────── INTRO ─────────────────────── */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center text-center py-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold)]/15 sm:h-20 sm:w-20">
                <Sparkles className="h-7 w-7 text-[var(--color-gold)] sm:h-8 sm:w-8" />
              </div>
              <h3 className="mt-6 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] sm:mt-8 sm:text-3xl">{t('start')}</h3>
              <p className="mt-4 max-w-xl text-sm text-[var(--color-ink-soft)] sm:text-base">
                {locale === 'ar'
                  ? 'ثلاثة أقسام: ٢٥ سؤال اختيار من متعدد، قراءة جهرية لفقرة قصيرة، وكتابة فقرة. سيقوم الذكاء الاصطناعي بتحليل أدائك في المهارات الأربع وإرسال التقرير الكامل إلى المركز.'
                  : 'Three parts: 25 multiple-choice questions, a short read-aloud passage, and a writing task. AI will analyze your performance across all four skills and send the full report to the center.'}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                <div className="rounded-sm bg-[var(--color-ivory)] px-3 py-3"><BookOpen className="mx-auto h-4 w-4 text-[var(--color-gold)]" /><div className="mt-2">{locale === 'ar' ? '٢٥ سؤال' : '25 MCQ'}</div></div>
                <div className="rounded-sm bg-[var(--color-ivory)] px-3 py-3"><Mic className="mx-auto h-4 w-4 text-[var(--color-gold)]" /><div className="mt-2">{locale === 'ar' ? 'قراءة' : 'Read aloud'}</div></div>
                <div className="rounded-sm bg-[var(--color-ivory)] px-3 py-3"><PenLine className="mx-auto h-4 w-4 text-[var(--color-gold)]" /><div className="mt-2">{locale === 'ar' ? 'كتابة' : 'Writing'}</div></div>
              </div>
              <div className="mt-8">
                <Button size="lg" magnetic onClick={start} disabled={!questions || questions.length === 0}>
                  {!questions ? t('loading') : t('start')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
              {questions !== null && questions.length === 0 && (
                <p className="mt-4 text-xs text-[var(--color-rose)]">
                  {locale === 'ar' ? 'لم تُحمَّل الأسئلة. أعد المحاولة لاحقاً.' : 'Questions not loaded. Try again in a moment.'}
                </p>
              )}
            </motion.div>
          )}

          {/* ───────────────────── MCQ ─────────────────────── */}
          {stage === 'mcq' && q && (
            <motion.div
              key={`mcq-${idx}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                <span>{locale === 'ar' ? `سؤال ${idx + 1} من ${total}` : `Part 1 — Question ${idx + 1} of ${total}`}</span>
                <span>{Math.round(((idx + 1) / total) * 100)}%</span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--color-ivory)]">
                <motion.div
                  className="h-full bg-[var(--color-gold)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((idx + 1) / total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <h3 className="mt-6 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)] sm:mt-8 sm:text-2xl lg:text-3xl">
                {locale === 'ar' ? q.prompt_ar : q.prompt_en}
              </h3>
              <div className="mt-6 grid gap-2.5 sm:mt-8 sm:gap-3">
                {q.options.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => answerMcq(i)}
                    dir="ltr"
                    className="group flex items-start justify-between gap-3 rounded-sm bg-[var(--color-ivory)] px-4 py-3 text-start text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition hover:ring-[var(--color-rlc-800)] hover:bg-[var(--color-rlc-100)] sm:items-center sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <span className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] text-xs font-semibold ring-1 ring-[var(--color-line)] group-hover:bg-[var(--color-rlc-800)] group-hover:text-[var(--color-cream)] group-hover:ring-[var(--color-rlc-800)]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="min-w-0 break-words">{locale === 'ar' ? o.ar : o.en}</span>
                    </span>
                    <span aria-hidden className="shrink-0 text-[var(--color-ink-soft)] opacity-0 transition group-hover:opacity-100">→</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  onClick={() => setIdx(Math.max(0, idx - 1))}
                  disabled={idx === 0}
                  className="inline-flex items-center gap-2 text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="rtl:rotate-180" aria-hidden>←</span>{t('prev')}
                </button>
              </div>
            </motion.div>
          )}

          {/* ───────────────────── SPEAK ─────────────────────── */}
          {stage === 'speak' && (
            <motion.div
              key="speak"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                {locale === 'ar' ? 'القسم ٢ — القراءة الجهرية' : 'Part 2 — Read aloud'}
              </div>
              <h3 className="mt-3 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] lg:text-3xl">
                {locale === 'ar' ? 'اقرأ المقطع التالي بصوت عالٍ' : 'Read this passage aloud'}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {locale === 'ar'
                  ? 'اضغط على زر التسجيل واقرأ بوضوح. سيقوم الذكاء الاصطناعي بتقييم النطق والطلاقة.'
                  : 'Press the microphone and read clearly. AI will evaluate your pronunciation and fluency.'}
              </p>

              <div className="mt-6 rounded-sm bg-[var(--color-ivory)] p-4 text-base leading-relaxed text-[var(--color-ink)] sm:p-6 sm:text-lg" dir="ltr">
                "{READING_PASSAGE}"
              </div>

              {!speechSupported ? (
                <p className="mt-6 rounded-sm bg-[var(--color-gold-soft)]/40 p-4 text-sm text-[var(--color-rlc-900)]">
                  {locale === 'ar'
                    ? 'متصفحك لا يدعم التسجيل الصوتي. يمكنك المتابعة دون قراءة جهرية.'
                    : "Your browser doesn't support voice recording. You can continue without the read-aloud."}
                </p>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <motion.button
                    onClick={isRecording ? stopRec : startRec}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all sm:h-20 sm:w-20 ${
                      isRecording
                        ? 'bg-[var(--color-rose)] text-[var(--color-cream)] shadow-[0_10px_30px_-8px_rgba(180,92,92,0.6)]'
                        : 'bg-[var(--color-rlc-800)] text-[var(--color-cream)] shadow-[0_10px_30px_-12px_rgba(8,57,34,0.6)]'
                    }`}
                  >
                    {isRecording ? <Square className="h-6 w-6 sm:h-7 sm:w-7" /> : <Mic className="h-7 w-7 sm:h-8 sm:w-8" />}
                    {isRecording && (
                      <motion.span
                        aria-hidden
                        className="absolute -inset-2 rounded-full border-2 border-[var(--color-rose)]/40"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.button>
                  <span className="text-sm font-medium text-[var(--color-ink-soft)]">
                    {isRecording
                      ? (locale === 'ar' ? 'جارٍ التسجيل... اضغط للإيقاف' : 'Recording… tap to stop')
                      : (locale === 'ar' ? 'اضغط للبدء بالقراءة' : 'Tap the mic to begin')}
                  </span>
                </div>
              )}

              {transcript && (
                <div className="mt-6 rounded-sm bg-[var(--color-rlc-100)] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">
                    {locale === 'ar' ? 'ما تم تسجيله' : 'What we heard'}
                  </div>
                  <p className="mt-2 text-sm italic text-[var(--color-ink)]" dir="ltr">"{transcript}"</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-end">
                <Button onClick={nextFromSpeak} size="md" variant="gold">
                  {locale === 'ar' ? 'القسم التالي' : 'Next part'}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ───────────────────── WRITE ─────────────────────── */}
          {stage === 'write' && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                {locale === 'ar' ? 'القسم ٣ — الكتابة' : 'Part 3 — Writing'}
              </div>
              <h3 className="mt-3 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] lg:text-3xl">
                {locale === 'ar' ? WRITING_PROMPT.ar : WRITING_PROMPT.en}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {locale === 'ar'
                  ? 'اكتب بحرّيتك. سيقوم معلّم ذكاء اصطناعي بتقييم القواعد والمفردات والتماسك.'
                  : 'Write freely. An AI teacher will evaluate grammar, vocabulary, and coherence.'}
              </p>
              <textarea
                value={writtenText}
                onChange={(e) => setWrittenText(e.target.value)}
                rows={8}
                placeholder={locale === 'ar' ? 'ابدأ الكتابة هنا...' : 'Start writing here…'}
                dir="ltr"
                className="mt-6 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-base ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                <span>{writtenText.trim().split(/\s+/).filter(Boolean).length} {locale === 'ar' ? 'كلمة' : 'words'}</span>
                <span>{locale === 'ar' ? 'موصى به: ٤٠–١٠٠ كلمة' : 'Recommended: 40–100 words'}</span>
              </div>
              <div className="mt-8 flex items-center justify-end">
                <Button onClick={nextFromWrite} size="md" variant="gold" disabled={writtenText.trim().length < 5}>
                  {locale === 'ar' ? 'إنهاء' : 'Finish'}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ───────────────────── CAPTURE ─────────────────────── */}
          {stage === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold)]/15 sm:h-20 sm:w-20">
                <Check className="h-7 w-7 text-[var(--color-gold)] sm:h-8 sm:w-8" />
              </div>
              <h3 className="mt-6 text-center font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] sm:text-3xl">
                {locale === 'ar' ? 'أحسنت! نحتاج بياناتك لإرسال التقرير' : "All done! We just need your details"}
              </h3>
              <p className="mt-3 max-w-md text-center text-sm text-[var(--color-ink-soft)]">{t('captureLede')}</p>

              <div className="mt-6 grid w-full max-w-xl gap-3 md:grid-cols-2">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={t('nameLabel')} required
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailLabel')} required dir="ltr"
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                />
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('phoneLabel')} required dir="ltr"
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)] md:col-span-2"
                />
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  onClick={submitAll}
                  size="lg"
                  variant="gold"
                  disabled={!name.trim() || !email.trim() || !phone.trim()}
                >
                  {t('send')} <Send className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ───────────────────── SENDING ─────────────────────── */}
          {stage === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />
              <p className="mt-6 text-sm uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('sending')}</p>
            </motion.div>
          )}

          {/* ───────────────────── SENT ─────────────────────── */}
          {stage === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center text-center py-16"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]"
              >
                <Check className="h-12 w-12" />
              </motion.div>
              <h3 className="mt-8 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{t('sent')}</h3>
              <p className="mt-3 max-w-md text-sm text-[var(--color-ink-soft)]">
                {locale === 'ar'
                  ? 'فريقنا سيراجع تقريرك ويتواصل معك قريباً عبر البريد أو الواتساب.'
                  : 'Our team will review your report and reach out to you soon by email or WhatsApp.'}
              </p>
              <button
                onClick={restart}
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]"
              >
                <RefreshCw className="h-4 w-4" /> {t('restart')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}

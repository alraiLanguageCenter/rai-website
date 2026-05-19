'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Q = {
  id: string;
  prompt_en: string; prompt_ar: string;
  options: { en: string; ar: string }[];
  correct_idx: number;
  difficulty: number;
  skill_tag: string | null;
};
type Level = { code: string; label_en: string; label_ar: string; min_score: number };
type Rec = { level_code: string; books: string[]; notes_en: string | null; notes_ar: string | null };

type Stage = 'intro' | 'quiz' | 'result';

export function Assessment() {
  const t = useTranslations('assess');
  const locale = useLocale() as 'ar' | 'en';

  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [stage, setStage] = useState<Stage>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        // Random-sample 20 questions per attempt so every taker gets a fresh set.
        const sampleRes = await fetch('/api/quiz/questions?count=20').then((r) => r.json()).catch(() => null);
        if (sampleRes?.ok && Array.isArray(sampleRes.questions) && sampleRes.questions.length > 0) {
          setQuestions(sampleRes.questions as Q[]);
        } else {
          // Fallback: direct anon read
          const qRes = await sb.from('quiz_questions').select('id,prompt_en,prompt_ar,options,correct_idx,difficulty,skill_tag').eq('active', true).limit(20);
          setQuestions(qRes.error ? [] : ((qRes.data ?? []) as Q[]));
        }
        const [lRes, rRes] = await Promise.all([
          sb.from('quiz_levels').select('code,label_en,label_ar,min_score').order('sort_order', { ascending: true }),
          sb.from('quiz_recommendations').select('level_code,books,notes_en,notes_ar'),
        ]);
        if (!lRes.error && lRes.data) setLevels(lRes.data as Level[]);
        if (!rRes.error && rRes.data) setRecs(rRes.data as Rec[]);
      } catch {
        setQuestions([]);
      }
    })();
  }, []);

  const total = questions?.length ?? 0;
  const score = answers.reduce((acc, a, i) => acc + (questions && a === questions[i].correct_idx ? 1 : 0), 0);
  const level = pickLevel(score, levels);
  const rec = level ? recs.find((r) => r.level_code === level.code) : undefined;

  function start() {
    setIdx(0); setAnswers([]); setSent(false); setStage('quiz');
  }
  function answer(optionIdx: number) {
    if (!questions) return;
    const next = [...answers]; next[idx] = optionIdx;
    setAnswers(next);
    if (idx < total - 1) setIdx(idx + 1);
    else finalize(next);
  }
  function finalize(finalAnswers: number[]) {
    setStage('result');
    if (!questions) return;
    const lvl = pickLevel(finalAnswers.reduce((a, ans, i) => a + (ans === questions[i].correct_idx ? 1 : 0), 0), levels);
    if (!lvl) return;
    // Fire-and-forget log; don't block UI
    fetch('/api/assessment/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: '', name: '', locale, level: lvl.code,
        score: finalAnswers.reduce((a, ans, i) => a + (ans === questions[i].correct_idx ? 1 : 0), 0),
        answers: finalAnswers.map((selectedIndex, i) => ({
          questionId: questions[i].id, selectedIndex, correct: selectedIndex === questions[i].correct_idx, skillTag: questions[i].skill_tag ?? '',
        })),
      }),
    }).catch(() => {});
  }
  async function sendResult() {
    if (!email || !level) return;
    setSending(true);
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email, name, locale, level: level.code, score,
          answers: answers.map((selectedIndex, i) => ({
            questionId: questions![i].id, selectedIndex, correct: selectedIndex === questions![i].correct_idx, skillTag: questions![i].skill_tag ?? '',
          })),
          sendEmail: true,
        }),
      });
      if (!res.ok) throw new Error('fail');
      setSent(true);
      toast.success(t('sent'));
    } catch {
      toast.error('Error');
    } finally {
      setSending(false);
    }
  }
  function restart() {
    setStage('intro'); setIdx(0); setAnswers([]); setSent(false); setEmail(''); setName('');
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

      <div className="mt-12 rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)] lg:p-12 min-h-[420px]">
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-gold)]/15">
                <Sparkles className="h-8 w-8 text-[var(--color-gold)]" />
              </div>
              <h3 className="mt-8 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{t('start')}</h3>
              <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
                {locale === 'ar'
                  ? '١٥ سؤالاً متعدد الاختيارات. لا حاجة للتسجيل. النتيجة فورية.'
                  : '15 multiple-choice questions. No sign-up needed. Instant result.'}
              </p>
              <div className="mt-8">
                <Button size="lg" magnetic onClick={start} disabled={!questions || questions.length === 0}>
                  {!questions ? t('loading') : t('start')}
                  <span aria-hidden className="rtl:rotate-180">→</span>
                </Button>
              </div>
              {questions !== null && questions.length === 0 && (
                <p className="mt-4 text-xs text-[var(--color-rose)]">
                  {locale === 'ar' ? 'لم تُحمَّل الأسئلة بعد. أعد المحاولة لاحقاً.' : 'Questions not yet loaded. Try again in a moment.'}
                </p>
              )}
            </motion.div>
          )}

          {stage === 'quiz' && q && (
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                <span>{t('question', { n: idx + 1, total })}</span>
                <span>{(idx + 1) / total * 100 | 0}%</span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--color-ivory)]">
                <motion.div className="h-full bg-[var(--color-gold)]" initial={{ width: 0 }} animate={{ width: `${((idx + 1) / total) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
              <h3 className="mt-8 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] lg:text-3xl">
                {locale === 'ar' ? q.prompt_ar : q.prompt_en}
              </h3>
              <div className="mt-8 grid gap-3">
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => answer(i)} dir="ltr"
                    className="group flex items-center justify-between gap-4 rounded-sm bg-[var(--color-ivory)] px-5 py-4 text-start text-[var(--color-ink)] ring-1 ring-[var(--color-line)] transition hover:ring-[var(--color-rlc-800)] hover:bg-[var(--color-rlc-100)]">
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-cream)] text-xs font-semibold ring-1 ring-[var(--color-line)] group-hover:bg-[var(--color-rlc-800)] group-hover:text-[var(--color-cream)] group-hover:ring-[var(--color-rlc-800)]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{locale === 'ar' ? o.ar : o.en}</span>
                    </span>
                    <span aria-hidden className="text-[var(--color-ink-soft)] opacity-0 transition group-hover:opacity-100">→</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm">
                <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
                  className="inline-flex items-center gap-2 text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)] disabled:opacity-30 disabled:cursor-not-allowed">
                  <span className="rtl:rotate-180" aria-hidden>←</span>{t('prev')}
                </button>
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                  {q.skill_tag ? `· ${q.skill_tag}` : ''}
                </span>
              </div>
            </motion.div>
          )}

          {stage === 'result' && level && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-10 lg:grid-cols-2">
              <div>
                <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{t('resultTitle')}</div>
                <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mt-3 font-[var(--font-display)] text-[6rem] leading-none text-[var(--color-rlc-900)] lg:text-[7rem]">
                  {level.code}
                </motion.div>
                <div className="mt-2 text-lg text-[var(--color-ink-soft)]">
                  {locale === 'ar' ? level.label_ar : level.label_en}
                </div>
                <div className="mt-6 text-sm text-[var(--color-ink-soft)]">
                  {locale === 'ar' ? `النتيجة: ${score} / ${total}` : `Score: ${score} / ${total}`}
                </div>
                <button onClick={restart} className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]">
                  <RefreshCw className="h-4 w-4" /> {t('restart')}
                </button>
              </div>
              <div>
                <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{t('recommendedBooks')}</div>
                <ul className="mt-3 space-y-2">
                  {(rec?.books ?? []).map((book) => (
                    <li key={book} className="flex items-start gap-3 rounded-sm bg-[var(--color-ivory)] px-4 py-3 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                      {book}
                    </li>
                  ))}
                  {(rec?.books ?? []).length === 0 && (
                    <li className="rounded-sm bg-[var(--color-ivory)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
                      {locale === 'ar' ? 'سنرسل لك التوصيات تفصيلياً عبر البريد.' : 'We\'ll email you detailed recommendations.'}
                    </li>
                  )}
                </ul>

                {!sent ? (
                  <div className="mt-8 rounded-sm bg-[var(--color-rlc-100)] p-5">
                    <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{t('captureTitle')}</div>
                    <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t('captureLede')}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={locale === 'ar' ? 'الاسم الكامل' : t('nameLabel')}
                        required
                        className="w-full rounded-sm border-0 bg-[var(--color-cream)] px-4 py-2.5 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('emailLabel')}
                        required
                        className="w-full rounded-sm border-0 bg-[var(--color-cream)] px-4 py-2.5 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                      />
                    </div>
                    <Button
                      onClick={sendResult}
                      size="md"
                      variant="gold"
                      disabled={sending || !email || !name}
                      className="mt-4"
                    >
                      {sending ? t('sending') : <>{t('send')} <Send className="h-3.5 w-3.5" /></>}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 rounded-sm bg-[var(--color-rlc-100)] p-5 text-[var(--color-rlc-800)]">{t('sent')}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}

function pickLevel(score: number, levels: Level[]): Level | null {
  if (levels.length === 0) return null;
  const sorted = [...levels].sort((a, b) => a.min_score - b.min_score);
  let pick = sorted[0];
  for (const l of sorted) if (score >= l.min_score) pick = l;
  return pick;
}

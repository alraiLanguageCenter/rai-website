'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Exam = { id: string; title: string; description: string | null; duration_min: number | null };
type Q = { id: string; prompt: string; options: string[]; correct_idx: number; points: number };

export default function StudentTakeExam({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <StudentShell><Body examId={id} /></StudentShell>;
}

function Body({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<{ score: number; max: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: e } = await sb.from('exams').select('id,title,description,duration_min').eq('id', examId).maybeSingle();
      setExam(e as Exam | null);
      const { data: qs } = await sb.from('exam_questions').select('*').eq('exam_id', examId).order('sort_order');
      setQuestions((qs ?? []) as Q[]);
    })();
  }, [examId]);

  function answer(opt: number) {
    const next = [...answers]; next[idx] = opt;
    setAnswers(next);
    if (idx < questions.length - 1) setTimeout(() => setIdx(idx + 1), 200);
  }

  async function submit() {
    if (!questions.length) return;
    setSubmitting(true);
    try {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new Error('not signed in');

      let score = 0;
      let max = 0;
      const submitted = questions.map((q, i) => {
        max += q.points;
        const correct = answers[i] === q.correct_idx;
        if (correct) score += q.points;
        return { questionId: q.id, selectedIdx: answers[i] ?? -1, correct };
      });

      const { error } = await sb.from('exam_submissions').insert({
        exam_id: examId, student_id: u.user.id, answers: submitted, score, max_score: max,
      });
      if (error) throw error;
      setDone({ score, max });
      toast.success('Submitted');
    } catch (e) {
      toast.error('Submit failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!exam) return <div className="grid h-32 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>;

  if (done) {
    const pct = done.max ? Math.round((done.score / done.max) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
          <Check className="h-9 w-9" />
        </div>
        <h2 className="mt-6 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{exam.title}</h2>
        <div className="mt-4 font-[var(--font-display)] text-5xl text-[var(--color-rlc-900)]">{done.score} / {done.max}</div>
        <div className="mt-2 text-sm text-[var(--color-ink-soft)]">{pct}%</div>
        <button onClick={() => router.push('/student/marks')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          See all marks
        </button>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return <div className="rounded-sm bg-[var(--color-ivory)] p-6">No questions in this exam yet.</div>;

  const filled = answers.filter((a) => a !== undefined).length;
  const canSubmit = filled === questions.length;

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">{exam.title}</h1>
      <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{Math.round(((idx + 1) / questions.length) * 100)}%</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-ivory)]">
        <motion.div className="h-full bg-[var(--color-gold)]" initial={{ width: 0 }} animate={{ width: `${((idx + 1) / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
          <h2 className="mt-8 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)] lg:text-3xl">{q.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {q.options.map((o, i) => (
              <button key={i} onClick={() => answer(i)} dir="ltr"
                className={`flex items-center justify-between gap-4 rounded-sm px-5 py-4 text-start ring-1 transition ${
                  answers[idx] === i
                    ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)] ring-[var(--color-rlc-800)]'
                    : 'bg-[var(--color-ivory)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-rlc-800)]'
                }`}>
                <span className="inline-flex items-center gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ${
                    answers[idx] === i ? 'bg-[var(--color-cream)] text-[var(--color-rlc-800)] ring-[var(--color-cream)]' : 'bg-[var(--color-cream)] ring-[var(--color-line)]'
                  }`}>{String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)] disabled:opacity-30 disabled:cursor-not-allowed">
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(idx + 1)} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ivory)] px-4 py-2 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={!canSubmit || submitting} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
            {submitting ? 'Submitting…' : <>Submit exam <Send className="h-4 w-4" /></>}
          </button>
        )}
      </div>
      {!canSubmit && idx === questions.length - 1 && <p className="mt-3 text-right text-xs text-[var(--color-rose)]">Answer all questions before submitting ({filled}/{questions.length}).</p>}
    </div>
  );
}

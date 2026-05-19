'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Draft = {
  prompt: string;
  options: string[];
  correctIdx: number;
  points: number;
};

export default function NewExamPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetClassId = sp.get('classId') ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [classId, setClassId] = useState(presetClassId);
  const [questions, setQuestions] = useState<Draft[]>([
    { prompt: '', options: ['', '', '', ''], correctIdx: 0, points: 1 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const { data } = await sb.from('classes').select('id,title').eq('teacher_id', u.user.id);
      setClasses((data ?? []) as { id: string; title: string }[]);
    })();
  }, []);

  function addQuestion() {
    setQuestions((q) => [...q, { prompt: '', options: ['', '', '', ''], correctIdx: 0, points: 1 }]);
  }
  function removeQuestion(i: number) { setQuestions((q) => q.filter((_, idx) => idx !== i)); }
  function updateQ(i: number, patch: Partial<Draft>) { setQuestions((q) => q.map((x, idx) => idx === i ? { ...x, ...patch } : x)); }
  function updateOpt(qi: number, oi: number, val: string) {
    setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q));
  }

  async function save(publish: boolean) {
    if (!title.trim()) { toast.error('Title required'); return; }
    if (questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) {
      toast.error('Every question and option needs text'); return;
    }
    setSaving(true);
    try {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      const total = questions.reduce((a, q) => a + q.points, 0);
      const { data: exam, error } = await sb.from('exams').insert({
        title, description, duration_min: duration,
        class_id: classId || null, teacher_id: u.user?.id,
        status: publish ? 'open' : 'draft',
        total_points: total,
      }).select('id').single();
      if (error || !exam) throw error;

      const rows = questions.map((q, i) => ({
        exam_id: exam.id, prompt: q.prompt, options: q.options, correct_idx: q.correctIdx, points: q.points, sort_order: i + 1,
      }));
      const { error: qerr } = await sb.from('exam_questions').insert(rows);
      if (qerr) throw qerr;

      toast.success(publish ? 'Exam published' : 'Draft saved');
      router.push(`/teacher/exams/${exam.id}`);
    } catch (e) {
      toast.error('Save failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/teacher/exams" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <h1 className="mt-4 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">New MCQ exam</h1>

      <div className="mt-6 grid gap-3 rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] md:grid-cols-[1fr_180px_180px]">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm — Unit 3"
            className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Duration (min)</span>
          <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
            className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Class (optional)</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
            <option value="">— Any student —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description / instructions" rows={2}
          className="md:col-span-3 mt-1 resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
      </div>

      <div className="mt-8 space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
              <span>Question {i + 1}</span>
              <button onClick={() => removeQuestion(i)} className="text-[var(--color-rose)]"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <textarea value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} placeholder="What is the question?" rows={2}
              className="mt-2 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
            <div className="mt-3 grid gap-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="grid items-center gap-2 md:grid-cols-[28px_1fr]">
                  <input type="radio" name={`correct-${i}`} checked={q.correctIdx === oi} onChange={() => updateQ(i, { correctIdx: oi })} />
                  <input value={o} onChange={(e) => updateOpt(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className="rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
                </div>
              ))}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs">
              <span>Points:</span>
              <input type="number" value={q.points} onChange={(e) => updateQ(i, { points: parseInt(e.target.value) || 1 })}
                className="w-16 rounded-sm border-0 bg-[var(--color-ivory)] px-2 py-1 text-xs ring-1 ring-[var(--color-line)] focus:outline-none" />
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ivory)] px-5 py-2.5 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]">
          <Plus className="h-4 w-4" /> Add question
        </button>
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-2 rounded-full ring-1 ring-[var(--color-rlc-800)]/30 bg-[var(--color-cream)] px-5 py-2.5 text-sm font-medium text-[var(--color-rlc-800)] hover:bg-[var(--color-rlc-100)]">
          <Save className="h-4 w-4" /> Save as draft
        </button>
        <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          {saving ? 'Saving…' : 'Publish exam'}
        </button>
      </div>
    </div>
  );
}

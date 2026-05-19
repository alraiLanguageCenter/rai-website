'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileQuestion, Users, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Exam = { id: string; title: string; description: string | null; status: string; total_points: number | null; class_id: string | null };
type Submission = { id: string; student_id: string; score: number; max_score: number; submitted_at: string; teacher_notes: string | null };
type Profile = { id: string; display_name: string | null; email: string | null };

export default function TeacherExamDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TeacherShell><Body examId={id} /></TeacherShell>;
}

function Body({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  async function load() {
    const sb = getSupabaseBrowser();
    const { data: e } = await sb.from('exams').select('*').eq('id', examId).maybeSingle();
    setExam(e as Exam | null);

    const { data: s } = await sb.from('exam_submissions').select('*').eq('exam_id', examId).order('submitted_at', { ascending: false });
    setSubs((s ?? []) as Submission[]);

    if (s && s.length) {
      const ids = (s as Submission[]).map((x) => x.student_id);
      const { data: ps } = await sb.from('profiles').select('id,display_name,email').in('id', ids);
      const map: Record<string, Profile> = {};
      (ps ?? []).forEach((p: Profile) => { map[p.id] = p; });
      setProfiles(map);
    }
  }
  useEffect(() => { load(); }, [examId]);

  async function setStatus(status: 'draft' | 'open' | 'closed') {
    const sb = getSupabaseBrowser();
    await sb.from('exams').update({ status }).eq('id', examId);
    toast.success(`Status: ${status}`);
    load();
  }

  async function saveNote(subId: string, note: string) {
    const sb = getSupabaseBrowser();
    await sb.from('exam_submissions').update({ teacher_notes: note }).eq('id', subId);
    toast.success('Note saved');
  }

  if (!exam) return <div className="grid h-32 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>;

  return (
    <div>
      <Link href="/teacher/exams" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">{exam.status}</div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{exam.title}</h1>
          {exam.description && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{exam.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStatus('draft')} className="rounded-full bg-[var(--color-ivory)] px-3 py-1.5 text-xs ring-1 ring-[var(--color-line)]">Draft</button>
          <button onClick={() => setStatus('open')} className="rounded-full bg-[var(--color-rlc-800)] px-3 py-1.5 text-xs font-medium text-[var(--color-cream)]">Open</button>
          <button onClick={() => setStatus('closed')} className="rounded-full bg-[var(--color-ivory)] px-3 py-1.5 text-xs ring-1 ring-[var(--color-line)]">Close</button>
        </div>
      </div>

      <h2 className="mt-10 inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
        <Users className="h-5 w-5 text-[var(--color-gold)]" /> Submissions ({subs.length})
      </h2>

      <div className="mt-4 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Teacher notes</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-cream)]">
            {subs.map((s) => {
              const pct = s.max_score ? Math.round((s.score / s.max_score) * 100) : 0;
              const p = profiles[s.student_id];
              return (
                <tr key={s.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p?.display_name ?? '—'}</div>
                    <div className="text-xs text-[var(--color-ink-soft)]" dir="ltr">{p?.email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pct >= 70 ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : pct >= 50 ? 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]' : 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'}`}>{s.score} / {s.max_score} ({pct}%)</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <NoteEditor initial={s.teacher_notes ?? ''} onSave={(v) => saveNote(s.id, v)} />
                  </td>
                </tr>
              );
            })}
            {subs.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-center gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add note…"
        className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-2 py-1.5 text-xs ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
      <button onClick={() => onSave(v)} className="text-[var(--color-rlc-800)]"><Save className="h-3.5 w-3.5" /></button>
    </div>
  );
}

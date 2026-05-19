'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  id: string; exam_id: string; student_id: string; score: number; max_score: number; submitted_at: string;
};

export default function TeacherGradesPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState<Record<string, { title: string; student_name: string | null; email: string | null }>>({});

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      // Get exams owned by me, then their submissions
      const { data: exams } = await sb.from('exams').select('id,title').eq('teacher_id', u.user.id);
      const examIds = (exams ?? []).map((e: { id: string }) => e.id);
      if (!examIds.length) { setRows([]); return; }
      const { data: subs } = await sb.from('exam_submissions').select('*').in('exam_id', examIds).order('submitted_at', { ascending: false });
      setRows((subs ?? []) as Row[]);

      const studentIds = (subs ?? []).map((s: Row) => s.student_id);
      const { data: ps } = await sb.from('profiles').select('id,display_name,email').in('id', studentIds);
      const m: typeof meta = {};
      (subs ?? []).forEach((s: Row) => {
        const examTitle = (exams ?? []).find((e: { id: string; title: string }) => e.id === s.exam_id)?.title ?? '';
        const profile = (ps ?? []).find((p: { id: string; display_name: string | null; email: string | null }) => p.id === s.student_id);
        m[s.id] = { title: examTitle, student_name: profile?.display_name ?? null, email: profile?.email ?? null };
      });
      setMeta(m);
    })();
  }, []);

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <ClipboardList className="h-7 w-7 text-[var(--color-gold)]" /> Grades
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Every submission from your students, newest first.</p>

      <div className="mt-8 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">When</th></tr>
          </thead>
          <tbody className="bg-[var(--color-cream)]">
            {rows === null && <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No submissions yet.</td></tr>}
            {(rows ?? []).map((r) => {
              const m = meta[r.id];
              const pct = r.max_score ? Math.round((r.score / r.max_score) * 100) : 0;
              return (
                <tr key={r.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m?.student_name ?? '—'}</div>
                    <div className="text-xs text-[var(--color-ink-soft)]" dir="ltr">{m?.email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3"><Link href={`/teacher/exams/${r.exam_id}`} className="text-[var(--color-rlc-800)] hover:underline">{m?.title ?? '—'}</Link></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${pct >= 70 ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : 'bg-[var(--color-ivory)]'}`}>{r.score}/{r.max_score} ({pct}%)</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">{new Date(r.submitted_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

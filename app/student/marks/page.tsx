'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = { id: string; exam_id: string; score: number; max_score: number; submitted_at: string; teacher_notes: string | null };

export default function StudentMarksPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const { data } = await sb.from('exam_submissions').select('*').eq('student_id', u.user.id).order('submitted_at', { ascending: false });
      setRows((data ?? []) as Row[]);
      const examIds = (data ?? []).map((r: Row) => r.exam_id);
      if (examIds.length) {
        const { data: exs } = await sb.from('exams').select('id,title').in('id', examIds);
        const m: Record<string, string> = {};
        (exs ?? []).forEach((e: { id: string; title: string }) => { m[e.id] = e.title; });
        setTitles(m);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <ClipboardList className="h-7 w-7 text-[var(--color-gold)]" /> My Marks
      </h1>
      <div className="mt-8 grid gap-3">
        {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No marks yet. Take an exam first.</div>}
        {(rows ?? []).map((r) => {
          const pct = r.max_score ? Math.round((r.score / r.max_score) * 100) : 0;
          return (
            <div key={r.id} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
              <div className="flex items-center justify-between">
                <div className="font-medium">{titles[r.exam_id] ?? '—'}</div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${pct >= 70 ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : pct >= 50 ? 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]' : 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'}`}>
                  {r.score} / {r.max_score} · {pct}%
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{new Date(r.submitted_at).toLocaleString()}</div>
              {r.teacher_notes && <div className="mt-3 rounded-sm bg-[var(--color-ivory)] p-3 text-xs text-[var(--color-ink-soft)]"><strong>Teacher note: </strong>{r.teacher_notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

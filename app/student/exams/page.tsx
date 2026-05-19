'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileQuestion, Check } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Exam = { id: string; title: string; description: string | null; due_at: string | null; total_points: number | null };
type Sub  = { exam_id: string; score: number; max_score: number };

export default function StudentExamsPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [subs, setSubs] = useState<Record<string, Sub>>({});

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const { data: ex } = await sb.from('exams').select('id,title,description,due_at,total_points').eq('status', 'open').order('due_at');
      setExams((ex ?? []) as Exam[]);
      const { data: s } = await sb.from('exam_submissions').select('exam_id,score,max_score').eq('student_id', u.user.id);
      const m: Record<string, Sub> = {};
      (s ?? []).forEach((x: Sub) => { m[x.exam_id] = x; });
      setSubs(m);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Exams</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">All open exams available to you.</p>

      <div className="mt-8 grid gap-3">
        {exams === null && <div className="grid h-24 place-items-center"><Spin /></div>}
        {exams?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No exams open right now.</div>}
        {(exams ?? []).map((e) => {
          const done = subs[e.id];
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-5 py-4 ring-1 ring-[var(--color-line)]">
              <FileQuestion className="h-5 w-5 text-[var(--color-gold)]" />
              <div className="flex-1">
                <div className="font-medium text-[var(--color-rlc-900)]">{e.title}</div>
                {e.description && <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{e.description}</div>}
              </div>
              {done ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-100)] px-3 py-1 text-xs font-medium text-[var(--color-rlc-800)]">
                  <Check className="h-3 w-3" /> Done · {done.score}/{done.max_score}
                </span>
              ) : (
                <Link href={`/student/exams/${e.id}`} className="rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
                  Start →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spin() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />; }

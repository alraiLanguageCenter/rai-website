'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileQuestion } from 'lucide-react';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Exam = { id: string; title: string; status: string; class_id: string | null; due_at: string | null; total_points: number | null };

export default function TeacherExamsPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const [rows, setRows] = useState<Exam[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const { data } = await sb.from('exams').select('*').eq('teacher_id', u.user.id).order('created_at', { ascending: false });
      setRows((data ?? []) as Exam[]);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Exams</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">MCQ exams you've created for your students.</p>
        </div>
        <Link href="/teacher/exams/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New MCQ exam
        </Link>
      </div>

      <div className="mt-8 grid gap-3">
        {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No exams yet.</div>}
        {(rows ?? []).map((e) => (
          <Link key={e.id} href={`/teacher/exams/${e.id}`} className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]">
            <FileQuestion className="h-4 w-4 text-[var(--color-gold)]" />
            <span className="flex-1">{e.title}</span>
            <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]">{e.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

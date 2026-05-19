'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type ClassRow = {
  id: string; title: string; description: string | null; level: string | null;
  kind: 'group' | 'private'; status: string; capacity: number | null;
  created_at: string;
};

export default function TeacherClassesPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const [rows, setRows] = useState<ClassRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('classes').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Load failed'); setRows([]); return; }
    setRows((data ?? []) as ClassRow[]);

    // student counts
    const ids = (data ?? []).map((c) => c.id);
    if (ids.length) {
      const { data: enrs } = await sb.from('enrollments').select('class_id').in('class_id', ids);
      const c: Record<string, number> = {};
      (enrs ?? []).forEach((e: { class_id: string }) => { c[e.class_id] = (c[e.class_id] ?? 0) + 1; });
      setCounts(c);
    }
  }
  useEffect(() => { load(); }, []);

  async function createClass() {
    const title = prompt('Class title?'); if (!title) return;
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    const { error } = await sb.from('classes').insert({
      title, teacher_id: u.user?.id, status: 'upcoming',
    });
    if (error) { toast.error('Create failed', { description: error.message }); return; }
    toast.success('Class created');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">My Classes</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Classes you teach. Click any class to manage students, materials, and exams.</p>
        </div>
        <button onClick={createClass}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New class
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows === null && <div className="col-span-full grid h-24 place-items-center"><Spin /></div>}
        {rows?.length === 0 && (
          <div className="col-span-full rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
            No classes yet — click <strong>New class</strong> to begin.
          </div>
        )}
        {(rows ?? []).map((c) => (
          <Link key={c.id} href={`/teacher/classes/${c.id}`}
            className="group block rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(8,57,34,0.3)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[var(--color-gold)]/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">
                {c.kind === 'private' ? 'private' : 'group'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[var(--color-rlc-800)]" />
            </div>
            <h3 className="mt-4 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">{c.title}</h3>
            {c.description && <p className="mt-2 text-sm text-[var(--color-ink-soft)] line-clamp-2">{c.description}</p>}
            <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {counts[c.id] ?? 0}{c.capacity ? ` / ${c.capacity}` : ''}</span>
              {c.level && <span>{c.level}</span>}
              <span>{c.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Spin() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />; }

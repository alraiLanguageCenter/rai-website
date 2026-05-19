'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileQuestion, Sparkles, ClipboardList, Library, BookOpen, ArrowUpRight, GraduationCap } from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function StudentDashboardPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [name, setName] = useState<string | null>(null);
  const [counts, setCounts] = useState({ classes: 0, openExams: 0, marks: 0 });

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      const { data: p } = await sb.from('profiles').select('display_name').eq('id', u.user.id).maybeSingle();
      setName((p as { display_name: string | null } | null)?.display_name ?? u.user.email ?? null);
      const [{ count: cl }, { count: ex }, { count: mk }] = await Promise.all([
        sb.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', u.user.id),
        sb.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        sb.from('exam_submissions').select('id', { count: 'exact', head: true }).eq('student_id', u.user.id),
      ]);
      setCounts({ classes: cl ?? 0, openExams: ex ?? 0, marks: mk ?? 0 });
    })();
  }, []);

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-4xl text-[var(--color-rlc-900)]">Welcome{name ? `, ${name}` : ''}</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">Your learning hub. Take exams, read materials, chat with your AI tutor, request sessions.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={counts.classes} Icon={GraduationCap} />
        <StatCard label="Open exams" value={counts.openExams} Icon={FileQuestion} />
        <StatCard label="Marks" value={counts.marks} Icon={ClipboardList} />
      </div>

      <h2 className="mt-12 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">Quick actions</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Quick href="/student/exams" Icon={FileQuestion} title="Take an exam" body="See exams open to you and start one." />
        <Quick href="/student/tutor" Icon={Sparkles} title="Your AI tutor" body="Chat with a private AI English teacher." />
        <Quick href="/student/library" Icon={BookOpen} title="Open the library" body="Read books with an interactive flip-page reader." />
        <Quick href="/student/sessions" Icon={Library} title="Book a session" body="Request an extra or private session." />
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
      <Icon className="h-5 w-5 text-[var(--color-gold)]" />
      <div className="mt-4 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</div>
    </div>
  );
}

function Quick({ href, Icon, title, body }: { href: string; Icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Link href={href} className="group block rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(8,57,34,0.25)]">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-[var(--color-gold)]" />
        <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[var(--color-rlc-800)]" />
      </div>
      <div className="mt-4 font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{title}</div>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{body}</p>
    </Link>
  );
}

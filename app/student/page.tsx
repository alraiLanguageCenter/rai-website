'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FileQuestion, Sparkles, ClipboardList, Library, BookOpen, ArrowUpRight,
  GraduationCap, Trophy, TrendingUp, CalendarPlus, MessageCircle, Hash,
  Loader2,
} from 'lucide-react';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type RecentMark = { id: string; score: number; max_score: number; submitted_at: string; exam_title: string };

export default function StudentDashboardPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const reduced = useReducedMotion();
  const [name, setName] = useState<string | null>(null);
  const [studentNumber, setStudentNumber] = useState<number | null>(null);
  const [counts, setCounts] = useState<{ classes: number; openExams: number; marks: number; avgPct: number } | null>(null);
  const [recent, setRecent] = useState<RecentMark[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return;
      const me = auth.user.id;
      const { data: profile } = await sb
        .from('profiles')
        .select('display_name, student_number')
        .eq('id', me)
        .maybeSingle();
      const p = profile as { display_name: string | null; student_number: number | null } | null;
      setName(p?.display_name ?? auth.user.email ?? null);
      setStudentNumber(p?.student_number ?? null);

      const [{ count: cl }, { count: ex }, { count: mk }, recentMarks] = await Promise.all([
        sb.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', me),
        sb.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        sb.from('exam_submissions').select('id', { count: 'exact', head: true }).eq('student_id', me),
        sb.from('exam_submissions')
          .select('id, exam_id, score, max_score, submitted_at')
          .eq('student_id', me)
          .order('submitted_at', { ascending: false })
          .limit(50),
      ]);

      const subs = (recentMarks.data ?? []) as { id: string; exam_id: string; score: number; max_score: number; submitted_at: string }[];
      const avgPct = subs.length
        ? Math.round(subs.reduce((acc, s) => acc + (s.max_score ? (s.score / s.max_score) * 100 : 0), 0) / subs.length)
        : 0;

      // Map exam titles
      const examIds = Array.from(new Set(subs.map((s) => s.exam_id)));
      let titleMap: Record<string, string> = {};
      if (examIds.length) {
        const r = await sb.from('exams').select('id,title').in('id', examIds);
        titleMap = Object.fromEntries(((r.data ?? []) as { id: string; title: string }[]).map((e) => [e.id, e.title]));
      }

      setCounts({
        classes: cl ?? 0,
        openExams: ex ?? 0,
        marks: mk ?? 0,
        avgPct,
      });
      setRecent(
        subs.slice(0, 5).map((s) => ({
          id: s.id, score: s.score, max_score: s.max_score, submitted_at: s.submitted_at,
          exam_title: titleMap[s.exam_id] ?? '—',
        })),
      );
    })();
  }, []);

  return (
    <div>
      {/* Hero greeting card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-md bg-gradient-to-br from-[var(--color-rlc-900)] via-[var(--color-rlc-800)] to-[var(--color-rlc-900)] p-6 text-[var(--color-cream)] sm:p-8"
      >
        {!reduced && (
          <>
            <motion.span aria-hidden className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-gold)]/22 blur-3xl"
              animate={{ y: [0, 12, 0], x: [0, -6, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.span aria-hidden className="pointer-events-none absolute -start-16 -bottom-16 h-56 w-56 rounded-full bg-[var(--color-rlc-700)]/45 blur-3xl"
              animate={{ y: [0, -10, 0], x: [0, 8, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
          </>
        )}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-gold)]">Student portal</div>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[var(--color-cream)] sm:text-5xl">
              {name ? `Welcome, ${name.split(' ')[0]} 🌿` : 'Welcome 🌿'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-cream)]/80">
              Take exams, read materials, chat with your AI tutor, request sessions.
            </p>
          </div>
          {studentNumber != null && (
            <div className="rounded-sm bg-[var(--color-cream)]/10 px-4 py-3 ring-1 ring-[var(--color-cream)]/20 backdrop-blur-sm">
              <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">Your student #</div>
              <div className="mt-1 inline-flex items-center gap-1 font-[var(--font-display)] text-2xl text-[var(--color-cream)]">
                <Hash className="h-5 w-5 text-[var(--color-gold)]" /> RLC-{studentNumber}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard delay={0.0}  label="Classes" value={counts?.classes} Icon={GraduationCap} accent="green" />
        <StatCard delay={0.05} label="Open exams" value={counts?.openExams} Icon={FileQuestion} accent="gold" href="/student/exams" />
        <StatCard delay={0.1}  label="My marks" value={counts?.marks} Icon={ClipboardList} accent="green" href="/student/marks" />
        <StatCard delay={0.15} label="Avg score" value={counts?.avgPct} valueSuffix="%" Icon={TrendingUp} accent="gold" href="/student/marks" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
            <Sparkles className="h-5 w-5 text-[var(--color-gold)]" /> Quick actions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BigAction href="/student/exams"   Icon={FileQuestion} title="Take an exam"        body="See exams open to you and start one." />
            <BigAction href="/student/tutor"   Icon={Sparkles}     title="Your AI tutor"       body="Chat with a private AI English teacher." />
            <BigAction href="/student/library" Icon={BookOpen}     title="Open the library"    body="Read books in an interactive flip reader." />
            <BigAction href="/student/sessions" Icon={CalendarPlus} title="Book a session"     body="Request an extra or private session." />
          </div>
        </div>

        {/* Recent marks */}
        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
              <Trophy className="h-5 w-5 text-[var(--color-gold)]" /> Recent marks
            </h2>
            <Link href="/student/marks" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)] transition hover:text-[var(--color-gold)]">
              All →
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {recent.length === 0 && counts === null && (
              <div className="grid h-20 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--color-rlc-700)]" /></div>
            )}
            {counts !== null && recent.length === 0 && (
              <div className="rounded-sm bg-[var(--color-ivory)] p-4 text-center text-xs text-[var(--color-ink-soft)]">
                No marks yet. Take an exam to see your score.
              </div>
            )}
            {recent.map((r, i) => {
              const pct = r.max_score ? Math.round((r.score / r.max_score) * 100) : 0;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-sm bg-[var(--color-ivory)] p-3 ring-1 ring-[var(--color-line)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-sm font-medium text-[var(--color-rlc-900)]">{r.exam_title}</div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                      pct >= 70 ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' :
                      pct >= 50 ? 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]' :
                      'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'
                    }`}>
                      {r.score}/{r.max_score} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{new Date(r.submitted_at).toLocaleDateString()}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4">
            <Link
              href="/student/complaints"
              className="group flex items-center gap-2 rounded-sm bg-[var(--color-ivory)] px-3 py-2 text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[var(--color-gold)]" />
              <span>Need help? Share a confidential complaint</span>
              <ArrowUpRight className="ms-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, valueSuffix = '', Icon, href, accent = 'gold', delay = 0,
}: {
  label: string;
  value: number | undefined;
  valueSuffix?: string;
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: 'gold' | 'green';
  delay?: number;
}) {
  const iconBg = accent === 'gold'
    ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
    : 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]';
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(8,57,34,0.3)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </span>
        {href && <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-rlc-800)]" />}
      </div>
      <div className="mt-3 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        {value == null ? <span className="opacity-30">—</span> : <>{value}{valueSuffix}</>}
      </div>
      <div className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</div>
    </motion.div>
  );
  return href ? <Link href={href} className="block">{card}</Link> : card;
}

function BigAction({ href, Icon, title, body }: { href: string; Icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-md bg-gradient-to-br from-[var(--color-ivory)] to-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)] transition-all hover:-translate-y-1 hover:ring-[var(--color-gold)]/60 hover:shadow-[0_18px_36px_-22px_rgba(8,57,34,0.3)]">
      <div className="flex items-start justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-rlc-800)]" />
      </div>
      <div className="mt-3 font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{title}</div>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{body}</p>
    </Link>
  );
}

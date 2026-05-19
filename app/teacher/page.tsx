'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GraduationCap, Library, FileQuestion, ClipboardList, Users,
  ArrowUpRight, Sparkles, Plus, TrendingUp, Activity, Loader2,
} from 'lucide-react';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Stats = {
  totalClasses: number;
  totalStudents: number;
  openExams: number;
  totalSubmissions: number;
  totalMaterials: number;
  avgScorePct: number;
};

type RecentSub = { id: string; score: number; max_score: number; submitted_at: string; exam_title: string; student_name: string | null };

export default function TeacherDashboardPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const reduced = useReducedMotion();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentSub[]>([]);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return;
      const me = auth.user.id;
      const { data: profile } = await sb.from('profiles').select('display_name').eq('id', me).maybeSingle();
      setName((profile as { display_name: string | null } | null)?.display_name ?? auth.user.email ?? null);

      // counts
      const { data: classes } = await sb.from('classes').select('id').eq('teacher_id', me);
      const classIds = (classes ?? []).map((c: { id: string }) => c.id);

      const [studentsRes, examsRes, materialsRes] = await Promise.all([
        classIds.length
          ? sb.from('enrollments').select('student_id', { count: 'exact', head: true }).in('class_id', classIds)
          : Promise.resolve({ count: 0 }),
        sb.from('exams').select('id', { count: 'exact', head: true }).eq('teacher_id', me).eq('status', 'open'),
        sb.from('lesson_materials').select('id', { count: 'exact', head: true }).eq('teacher_id', me),
      ]);

      const { data: examIds } = await sb.from('exams').select('id').eq('teacher_id', me);
      const examIdList = (examIds ?? []).map((e: { id: string }) => e.id);
      let subRows: { score: number; max_score: number; submitted_at: string; exam_id: string; student_id: string; id: string }[] = [];
      if (examIdList.length) {
        const r = await sb
          .from('exam_submissions')
          .select('id, exam_id, student_id, score, max_score, submitted_at')
          .in('exam_id', examIdList)
          .order('submitted_at', { ascending: false })
          .limit(50);
        subRows = (r.data ?? []) as typeof subRows;
      }
      const totalSubs = subRows.length;
      const avgPct = totalSubs
        ? Math.round(subRows.reduce((acc, s) => acc + (s.max_score ? (s.score / s.max_score) * 100 : 0), 0) / totalSubs)
        : 0;

      // Enrich recent: pull exam titles + student names
      const studentIds = Array.from(new Set(subRows.map((s) => s.student_id)));
      const [examsMap, profilesMap] = await Promise.all([
        examIdList.length
          ? sb.from('exams').select('id,title').in('id', examIdList).then((r) => Object.fromEntries(((r.data ?? []) as { id: string; title: string }[]).map((e) => [e.id, e.title])))
          : Promise.resolve({} as Record<string, string>),
        studentIds.length
          ? sb.from('profiles').select('id,display_name').in('id', studentIds).then((r) => Object.fromEntries(((r.data ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name])))
          : Promise.resolve({} as Record<string, string | null>),
      ]);

      setStats({
        totalClasses: classIds.length,
        totalStudents: studentsRes.count ?? 0,
        openExams: examsRes.count ?? 0,
        totalSubmissions: totalSubs,
        totalMaterials: materialsRes.count ?? 0,
        avgScorePct: avgPct,
      });

      setRecent(subRows.slice(0, 6).map((s) => ({
        id: s.id, score: s.score, max_score: s.max_score, submitted_at: s.submitted_at,
        exam_title: examsMap[s.exam_id] ?? '—',
        student_name: profilesMap[s.student_id] ?? null,
      })));
    })();
  }, []);

  return (
    <div>
      {/* Greeting band */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-md bg-gradient-to-br from-[var(--color-rlc-900)] via-[var(--color-rlc-800)] to-[var(--color-rlc-900)] p-6 text-[var(--color-cream)] sm:p-8"
      >
        {!reduced && (
          <motion.span aria-hidden className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-gold)]/22 blur-3xl"
            animate={{ y: [0, 12, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        )}
        <div className="relative">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-gold)]">Teacher portal</div>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[var(--color-cream)] sm:text-5xl">
            {name ? `Hello, ${name.split(' ')[0]} 🌿` : 'Hello there 🌿'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-cream)]/80">
            Your classes, exams, and student progress at a glance.
          </p>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard delay={0.0} label="Classes" value={stats?.totalClasses} Icon={GraduationCap} href="/teacher/classes" accent="gold" />
        <StatCard delay={0.05} label="Students" value={stats?.totalStudents} Icon={Users} href="/teacher/classes" accent="green" />
        <StatCard delay={0.1}  label="Open exams" value={stats?.openExams} Icon={FileQuestion} href="/teacher/exams" accent="gold" />
        <StatCard delay={0.15} label="Submissions" value={stats?.totalSubmissions} Icon={ClipboardList} href="/teacher/grades" accent="green" />
        <StatCard delay={0.2}  label="Materials" value={stats?.totalMaterials} Icon={Library} href="/teacher/materials" accent="gold" />
        <StatCard delay={0.25} label="Avg score" value={stats == null ? undefined : stats.avgScorePct} valueSuffix="%" Icon={TrendingUp} href="/teacher/grades" accent="green" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
              <Activity className="h-5 w-5 text-[var(--color-gold)]" /> Recent submissions
            </h2>
            <Link href="/teacher/grades" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)] transition hover:text-[var(--color-gold)]">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--color-line)]">
            {recent.length === 0 && stats === null && (
              <div className="grid h-20 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--color-rlc-700)]" /></div>
            )}
            {stats !== null && recent.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--color-ink-soft)]">No submissions yet.</div>
            )}
            {recent.map((r, i) => {
              const pct = r.max_score ? Math.round((r.score / r.max_score) * 100) : 0;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--color-rlc-900)]">{r.student_name ?? '—'}</div>
                    <div className="truncate text-xs text-[var(--color-ink-soft)]">{r.exam_title} · {new Date(r.submitted_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    pct >= 70 ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' :
                    pct >= 50 ? 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]' :
                    'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'
                  }`}>
                    {r.score}/{r.max_score} ({pct}%)
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
            <Sparkles className="h-5 w-5 text-[var(--color-gold)]" /> Quick actions
          </h2>
          <div className="mt-4 grid gap-2">
            <Quick href="/teacher/exams/new" Icon={Plus} label="Build a new exam" />
            <Quick href="/teacher/materials" Icon={Library} label="Upload a material" />
            <Quick href="/teacher/classes" Icon={GraduationCap} label="My classes" />
            <Quick href="/teacher/grades" Icon={ClipboardList} label="View all grades" />
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
  href: string;
  accent?: 'gold' | 'green';
  delay?: number;
}) {
  const iconBg = accent === 'gold'
    ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
    : 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group block rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(8,57,34,0.3)]"
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-full ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-rlc-800)]" />
        </div>
        <div className="mt-3 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
          {value == null ? <span className="opacity-30">—</span> : <>{value}{valueSuffix}</>}
        </div>
        <div className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</div>
      </Link>
    </motion.div>
  );
}

function Quick({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-sm bg-[var(--color-ivory)] px-3 py-2.5 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

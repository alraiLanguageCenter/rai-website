'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Users, UserPlus, FileQuestion, ClipboardList, MessageCircle, Megaphone,
  CalendarPlus, Sparkles, ArrowUpRight, TrendingUp, GraduationCap, Hash,
  Activity, BadgeCheck, Loader2,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Stats = {
  pendingApplications: number;
  approvedStudents: number;
  totalApplications: number;
  pendingComplaints: number;
  pendingBookings: number;
  openExams: number;
  totalAttempts: number;
  contactSubmissions: number;
  latestStudentNumber: number | null;
};

type RecentApp = {
  id: string;
  full_name: string;
  status: string;
  applied_at: string;
  target_language: string | null;
  assigned_student_number: number | null;
};

export default function AdminDashboardPage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const reduced = useReducedMotion();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentApp[]>([]);
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      // who am I
      const { data: auth } = await sb.auth.getUser();
      if (auth.user) {
        const { data: profile } = await sb.from('profiles').select('display_name').eq('id', auth.user.id).maybeSingle();
        setAdminName((profile as { display_name: string | null } | null)?.display_name ?? auth.user.email ?? null);
      }

      // dashboard numbers — pulled in parallel, all counts
      const [
        pendingApps, approvedApps, totalApps,
        pendingCmp, pendingBk, openEx, atts, contacts, maxNum,
      ] = await Promise.all([
        sb.from('student_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb.from('student_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        sb.from('student_applications').select('id', { count: 'exact', head: true }),
        sb.from('complaints').select('id', { count: 'exact', head: true }).in('status', ['open', 'reviewing']),
        sb.from('assessment_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb.from('exams').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        sb.from('quiz_attempts').select('id', { count: 'exact', head: true }),
        sb.from('contact_submissions').select('id', { count: 'exact', head: true }),
        sb.from('student_applications').select('assigned_student_number').order('assigned_student_number', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
      ]);

      setStats({
        pendingApplications:  pendingApps.count ?? 0,
        approvedStudents:     approvedApps.count ?? 0,
        totalApplications:    totalApps.count ?? 0,
        pendingComplaints:    pendingCmp.count ?? 0,
        pendingBookings:      pendingBk.count ?? 0,
        openExams:            openEx.count ?? 0,
        totalAttempts:        atts.count ?? 0,
        contactSubmissions:   contacts.count ?? 0,
        latestStudentNumber:  (maxNum.data as { assigned_student_number: number | null } | null)?.assigned_student_number ?? null,
      });

      // recent applications
      const { data: r } = await sb
        .from('student_applications')
        .select('id, full_name, status, applied_at, target_language, assigned_student_number')
        .order('applied_at', { ascending: false })
        .limit(6);
      setRecent((r ?? []) as RecentApp[]);
    })();
  }, []);

  return (
    <div>
      {/* ===== Greeting ===== */}
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
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(201,162,74,0.18) 50%, transparent 65%)' }}
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
            />
          </>
        )}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-gold)]">{greeting()} ✨</div>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[var(--color-cream)] sm:text-5xl">
              {adminName ? `Welcome, ${adminName.split(' ')[0]}` : 'Welcome back'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-cream)]/80">
              Here's what's happening across Rai Language Center today.
            </p>
          </div>
          {stats?.latestStudentNumber != null && (
            <div className="rounded-sm bg-[var(--color-cream)]/10 px-4 py-3 ring-1 ring-[var(--color-cream)]/20 backdrop-blur-sm">
              <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">Last student #</div>
              <div className="mt-1 inline-flex items-center gap-1 font-[var(--font-display)] text-2xl text-[var(--color-cream)]">
                <Hash className="h-5 w-5 text-[var(--color-gold)]" /> RLC-{stats.latestStudentNumber}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ===== Stat grid ===== */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard delay={0.0} accent="gold"  label="Pending applications" value={stats?.pendingApplications} Icon={UserPlus} href="/admin/students" highlight={stats?.pendingApplications ? true : false} />
        <StatCard delay={0.05} accent="green" label="Approved students" value={stats?.approvedStudents} Icon={BadgeCheck} href="/admin/students" />
        <StatCard delay={0.1}  accent="gold"  label="Pending bookings" value={stats?.pendingBookings} Icon={ClipboardList} href="/admin/bookings" highlight={stats?.pendingBookings ? true : false} />
        <StatCard delay={0.15} accent="rose"  label="Open complaints" value={stats?.pendingComplaints} Icon={MessageCircle} href="/admin/complaints" highlight={stats?.pendingComplaints ? true : false} />
        <StatCard delay={0.2}  accent="green" label="Open exams" value={stats?.openExams} Icon={FileQuestion} href="/admin/quiz" />
        <StatCard delay={0.25} accent="gold"  label="Placement attempts" value={stats?.totalAttempts} Icon={Sparkles} href="/admin/assessments" />
        <StatCard delay={0.3}  accent="green" label="Contact submissions" value={stats?.contactSubmissions} Icon={Activity} href="/admin/leads" />
        <StatCard delay={0.35} accent="gold"  label="Total applications" value={stats?.totalApplications} Icon={TrendingUp} href="/admin/students" />
      </div>

      {/* ===== Recent applications + Quick actions ===== */}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
              <UserPlus className="h-5 w-5 text-[var(--color-gold)]" /> Recent applications
            </h2>
            <Link href="/admin/students" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-rlc-800)] transition hover:text-[var(--color-gold)]">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--color-line)]">
            {recent.length === 0 && stats === null && (
              <div className="grid h-20 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--color-rlc-700)]" /></div>
            )}
            {recent.length === 0 && stats !== null && (
              <div className="py-8 text-center text-sm text-[var(--color-ink-soft)]">No applications yet.</div>
            )}
            {recent.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="flex items-center gap-3 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--color-rlc-900)]">{r.full_name}</div>
                  <div className="text-xs text-[var(--color-ink-soft)]">
                    {r.target_language ?? '—'} · {new Date(r.applied_at).toLocaleDateString()}
                  </div>
                </div>
                {r.assigned_student_number != null && (
                  <span className="rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 font-mono text-[0.65rem] text-[var(--color-rlc-800)]">
                    RLC-{r.assigned_student_number}
                  </span>
                )}
                <RecentStatusPill status={r.status} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
            <Sparkles className="h-5 w-5 text-[var(--color-gold)]" /> Quick actions
          </h2>
          <div className="mt-4 grid gap-2">
            <QuickAction href="/admin/announcements" Icon={Megaphone} label="Post announcement" />
            <QuickAction href="/admin/schedule" Icon={CalendarPlus} label="Add schedule entry" />
            <QuickAction href="/admin/quiz" Icon={FileQuestion} label="Manage quiz questions" />
            <QuickAction href="/admin/settings" Icon={Activity} label="System settings" />
            <QuickAction href="/register" Icon={UserPlus} label="Public registration page" external />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  label, value, Icon, href, accent = 'gold', delay = 0, highlight = false,
}: {
  label: string;
  value: number | undefined;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  accent?: 'gold' | 'green' | 'rose';
  delay?: number;
  highlight?: boolean;
}) {
  const ringCls = accent === 'gold' ? 'ring-[var(--color-gold)]/40' :
                  accent === 'rose' ? 'ring-[var(--color-rose)]/40' : 'ring-[var(--color-rlc-700)]/30';
  const iconBg = accent === 'gold' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]' :
                 accent === 'rose' ? 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]' : 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className={`group relative block overflow-hidden rounded-md bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(8,57,34,0.3)] hover:${ringCls}`}
      >
        {highlight && (
          <motion.span
            aria-hidden
            className="absolute end-3 top-3 inline-block h-2 w-2 rounded-full bg-[var(--color-rose)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-full ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-rlc-800)]" />
        </div>
        <div className="mt-3 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
          {value == null ? <span className="opacity-30">—</span> : value}
        </div>
        <div className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</div>
      </Link>
    </motion.div>
  );
}

function QuickAction({ href, Icon, label, external }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string; external?: boolean }) {
  const Inner = (
    <span className="group flex items-center gap-3 rounded-sm bg-[var(--color-ivory)] px-3 py-2.5 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
    </span>
  );
  return external
    ? <a href={href} target="_blank" rel="noreferrer noopener">{Inner}</a>
    : <Link href={href}>{Inner}</Link>;
}

function RecentStatusPill({ status }: { status: string }) {
  const cls = status === 'approved' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]'
    : status === 'rejected' ? 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'
    : status === 'waitlisted' ? 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)]'
    : 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]';
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] ${cls}`}>{status}</span>;
}

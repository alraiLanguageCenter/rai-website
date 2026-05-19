'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users, Check, X, Loader2, Hash, MapPin, BadgeCheck, Search,
  GraduationCap, Mail, Phone, Filter, Sparkles, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type App = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string | null;
  age_group: string | null;
  location: string | null;
  native_language: string | null;
  target_language: string | null;
  target_level: string | null;
  goals: string | null;
  source: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  assigned_student_number: number | null;
  decision_notes: string | null;
  applied_at: string;
  decided_at: string | null;
  locale: 'ar' | 'en';
};

type Status = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'all';

const STATUS_TABS: { id: Status; label: string }[] = [
  { id: 'pending',     label: 'Pending' },
  { id: 'approved',    label: 'Approved' },
  { id: 'waitlisted',  label: 'Waitlisted' },
  { id: 'rejected',    label: 'Rejected' },
  { id: 'all',         label: 'All' },
];

export default function AdminStudentsPage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<App[] | null>(null);
  const [tab, setTab] = useState<Status>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    let q = sb.from('student_applications').select('*').order('applied_at', { ascending: false }).limit(500);
    if (tab !== 'all') q = q.eq('status', tab);
    const { data, error } = await q;
    if (error) { toast.error('Load failed', { description: error.message }); setRows([]); return; }
    setRows((data ?? []) as App[]);
  }
  useEffect(() => { load(); }, [tab]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.full_name.toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      r.phone.toLowerCase().includes(s) ||
      (r.location ?? '').toLowerCase().includes(s) ||
      String(r.assigned_student_number ?? '').includes(s),
    );
  }, [rows, search]);

  /** Counts for the dashboard summary chips — across all loaded rows. */
  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, waitlisted: 0, total: 0 };
    (rows ?? []).forEach((r) => {
      c.total++;
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [rows]);

  async function decide(id: string, status: 'approved' | 'rejected' | 'waitlisted') {
    setBusyId(id);
    try {
      const sb = getSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      const { error } = await sb.from('student_applications').update({
        status, decided_by: user?.id ?? null,
      }).eq('id', id);
      if (error) throw error;
      toast.success(status === 'approved' ? 'Approved — student number assigned' : `Marked ${status}`);
      await load();
    } catch (e) {
      toast.error('Failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setBusyId(null);
    }
  }

  function downloadCsv() {
    if (!rows) return;
    const header = ['Student #','Applied','Status','Name','Email','Phone','Gender','Age group','Location','Target language','Level'];
    const lines = [header.join(',')];
    const safe = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
    (rows ?? []).forEach((r) => {
      lines.push([
        r.assigned_student_number ?? '',
        new Date(r.applied_at).toISOString(),
        r.status,
        safe(r.full_name),
        safe(r.email),
        safe(r.phone),
        r.gender ?? '',
        r.age_group ?? '',
        safe(r.location),
        r.target_language ?? '',
        r.target_level ?? '',
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rai-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
            <Users className="h-7 w-7 text-[var(--color-gold)]" /> Student applications
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Approve, reject, or waitlist applications from the public registration form. Approved students receive a unique student number automatically.
          </p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={!rows?.length}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ivory)] px-4 py-2 text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Download CSV
        </button>
      </div>

      {/* ===== Dashboard summary (level / gender / location distribution) ===== */}
      {rows && rows.length > 0 && <Dashboard rows={rows} />}

      {/* ===== Tabs ===== */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition ${
                tab === t.id ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]'
              }`}
            >
              {t.label}
              {tab === t.id && tab !== 'all' && (
                <span className="ms-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-gold)] px-1 text-[0.6rem] font-bold text-[var(--color-rlc-900)]">
                  {counts[t.id as 'pending' | 'approved' | 'rejected' | 'waitlisted'] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="relative inline-flex items-center">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, student #..."
            className="rounded-full bg-[var(--color-ivory)] py-2 pe-4 ps-9 text-xs ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
          />
        </label>
      </div>

      {/* ===== List ===== */}
      <div className="mt-6 grid gap-3">
        {rows === null && (
          <div className="grid h-24 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-rlc-700)]" />
          </div>
        )}
        {rows && filtered.length === 0 && (
          <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-sm text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
            {search ? 'No applications match your search.' : 'No applications in this status yet.'}
          </div>
        )}
        {filtered.map((r) => (
          <ApplicationCard key={r.id} app={r} busy={busyId === r.id} onDecide={decide} />
        ))}
      </div>
    </div>
  );
}

/* -------------------- Dashboard summary -------------------- */

function Dashboard({ rows }: { rows: App[] }) {
  // Count distributions
  const byLevel = countBy(rows, (r) => r.target_level || '—');
  const byGender = countBy(rows, (r) => r.gender || '—');
  const byLanguage = countBy(rows, (r) => r.target_language || '—');
  const byLocation = countBy(rows, (r) => (r.location || '—').split(',')[0].trim() || '—');

  const stats = [
    { label: 'Total applications', value: rows.length, accent: 'gold' as const },
    { label: 'Approved (with student #)', value: rows.filter((r) => r.status === 'approved').length, accent: 'green' as const },
    { label: 'Pending review', value: rows.filter((r) => r.status === 'pending').length, accent: 'soft' as const },
    { label: 'Waitlisted / Rejected', value: rows.filter((r) => r.status === 'waitlisted' || r.status === 'rejected').length, accent: 'soft' as const },
  ];

  return (
    <div className="mt-8 grid gap-5">
      {/* Top stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i}
            className={`rounded-sm p-5 ring-1 ring-[var(--color-line)] ${
              s.accent === 'gold' ? 'bg-[var(--color-gold)]/15' :
              s.accent === 'green' ? 'bg-[var(--color-rlc-100)]' : 'bg-[var(--color-ivory)]'
            }`}>
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{s.label}</div>
            <div className="mt-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{s.value}</div>
          </div>
        ))}
      </div>
      {/* Distribution panels */}
      <div className="grid gap-3 lg:grid-cols-4">
        <DistributionPanel title="Target language" Icon={Sparkles} entries={byLanguage} />
        <DistributionPanel title="Target level"    Icon={GraduationCap} entries={byLevel} />
        <DistributionPanel title="Gender"          Icon={Users} entries={byGender} />
        <DistributionPanel title="Top cities"      Icon={MapPin} entries={byLocation} />
      </div>
    </div>
  );
}

function DistributionPanel({
  title, Icon, entries,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  entries: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  const top = entries.slice(0, 5);
  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--color-gold)]" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {top.length === 0 && (
          <li className="text-xs text-[var(--color-ink-soft)]">No data.</li>
        )}
        {top.map((e) => (
          <li key={e.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-[var(--color-ink)]">{e.label}</span>
              <span className="ms-2 shrink-0 font-mono text-[var(--color-rlc-800)]">{e.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-ivory)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-rlc-800)] to-[var(--color-gold)] transition-all"
                style={{ width: `${(e.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function countBy<T>(arr: T[], key: (t: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  arr.forEach((x) => {
    const k = key(x);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* -------------------- Application card -------------------- */

function ApplicationCard({
  app, busy, onDecide,
}: {
  app: App;
  busy: boolean;
  onDecide: (id: string, s: 'approved' | 'rejected' | 'waitlisted') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <article className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] transition hover:shadow-[0_18px_40px_-24px_rgba(8,57,34,0.25)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">{app.full_name}</h3>
            {app.assigned_student_number != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-[0.65rem] font-mono font-semibold text-[var(--color-rlc-800)]">
                <Hash className="h-3 w-3" /> RLC-{app.assigned_student_number}
              </span>
            )}
            <StatusPill status={app.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
            <span className="inline-flex items-center gap-1" dir="ltr"><Mail className="h-3 w-3" /> {app.email}</span>
            <span className="inline-flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" /> {app.phone}</span>
            {app.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.location}</span>}
            <span className="inline-flex items-center gap-1"><Filter className="h-3 w-3" /> {fmt.format(new Date(app.applied_at))}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]"
        >
          {expanded ? 'Hide details' : 'Details'}
        </button>
      </div>

      {/* Quick chips */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {app.target_language && <Chip>{`🎯 ${app.target_language}`}</Chip>}
        {app.target_level && <Chip>{`📊 ${app.target_level}`}</Chip>}
        {app.age_group && <Chip>{`👤 ${app.age_group}`}</Chip>}
        {app.gender && <Chip>{`⚧ ${app.gender}`}</Chip>}
        {app.native_language && <Chip>{`🗣 ${app.native_language}`}</Chip>}
        {app.source && <Chip>{`📍 ${app.source}`}</Chip>}
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 rounded-sm bg-[var(--color-ivory)] p-4 text-sm md:grid-cols-2">
          {app.goals && (
            <div className="md:col-span-2">
              <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">Goals</div>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink-soft)]">{app.goals}</p>
            </div>
          )}
          {app.decision_notes && (
            <div className="md:col-span-2">
              <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">Internal note</div>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink-soft)]">{app.decision_notes}</p>
            </div>
          )}
          {app.decided_at && (
            <div className="md:col-span-2 text-xs text-[var(--color-ink-soft)]">
              Decided at: {fmt.format(new Date(app.decided_at))}
            </div>
          )}
        </div>
      )}

      {/* Action row — only if still pending or waitlisted */}
      {(app.status === 'pending' || app.status === 'waitlisted') && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {app.status !== 'waitlisted' && (
            <button
              onClick={() => onDecide(app.id, 'waitlisted')}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] disabled:opacity-50"
            >
              Waitlist
            </button>
          )}
          <button
            onClick={() => onDecide(app.id, 'rejected')}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
          <button
            onClick={() => onDecide(app.id, 'approved')}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
            Approve &amp; assign #
          </button>
        </div>
      )}
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-ivory)] px-2.5 py-0.5 text-[0.7rem] text-[var(--color-ink)] ring-1 ring-[var(--color-line)]">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: App['status'] }) {
  const map = {
    pending:    'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]',
    approved:   'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]',
    rejected:   'bg-[var(--color-rose)]/15 text-[var(--color-rose)]',
    waitlisted: 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)]',
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] ${map[status]}`}>
      {status}
    </span>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, Users, X, MapPin, GraduationCap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  id: string;
  kind: 'course' | 'exam';
  title_ar: string; title_en: string;
  description_ar: string | null; description_en: string | null;
  starts_at: string;
  ends_at: string | null;
  room: string | null;
  capacity: number | null;
  seats_taken: number;
  registration_url: string | null;
  status: 'open' | 'closed' | 'full';
  published: boolean;
};

export default function SchedulePage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('schedule_entries').select('*').order('starts_at', { ascending: true });
    if (error) { toast.error('Load failed', { description: error.message }); return; }
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function createNew() {
    const sb = getSupabaseBrowser();
    const starts = new Date(); starts.setDate(starts.getDate() + 7); starts.setMinutes(0, 0, 0);
    const { error, data } = await sb.from('schedule_entries').insert({
      kind: 'course',
      title_ar: 'دورة جديدة', title_en: 'New course',
      starts_at: starts.toISOString(),
      status: 'open', published: true, seats_taken: 0,
    }).select('*').single();
    if (error) { toast.error('Create failed'); return; }
    setRows((rs) => [data as Row, ...(rs ?? [])]);
  }

  async function save(r: Row) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('schedule_entries').update({
      kind: r.kind,
      title_ar: r.title_ar, title_en: r.title_en,
      description_ar: r.description_ar, description_en: r.description_en,
      starts_at: r.starts_at, ends_at: r.ends_at,
      room: r.room, capacity: r.capacity, seats_taken: r.seats_taken,
      registration_url: r.registration_url, status: r.status,
      published: r.published, updated_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }

  async function remove(id: string) {
    if (!confirm('Delete this entry?')) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('schedule_entries').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    setRows((rs) => (rs ?? []).filter((r) => r.id !== id));
  }

  function update(id: string, patch: Partial<Row>) {
    setRows((rs) => (rs ?? []).map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  const [candidatesOpen, setCandidatesOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Courses and exam dates shown on the public site.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCandidatesOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ivory)] px-4 py-2.5 text-sm font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:ring-[var(--color-gold)]/60"
          >
            <Users className="h-4 w-4" /> Registered candidates
          </button>
          <button onClick={createNew} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
            <Plus className="h-4 w-4" /> New entry
          </button>
        </div>
      </div>

      <AnimatePresence>
        {candidatesOpen && <CandidatesModal onClose={() => setCandidatesOpen(false)} />}
      </AnimatePresence>

      <div className="mt-8 grid gap-5">
        {rows === null && <div className="h-24 grid place-items-center"><Spin /></div>}
        {rows?.length === 0 && <Empty />}
        {(rows ?? []).map((r) => (
          <div key={r.id} className="rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
            <div className="grid gap-3 md:grid-cols-[120px_1fr_120px_120px]">
              <Select label="Kind" value={r.kind} onChange={(v) => update(r.id, { kind: v as 'course' | 'exam' })} options={[['course', 'Course'], ['exam', 'Exam']]} />
              <Input label="Title (EN)" value={r.title_en} onChange={(v) => update(r.id, { title_en: v })} />
              <Select label="Status" value={r.status} onChange={(v) => update(r.id, { status: v as Row['status'] })} options={[['open', 'Open'], ['closed', 'Closed'], ['full', 'Full']]} />
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Published</span>
                <div className="mt-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={r.published} onChange={(e) => update(r.id, { published: e.target.checked })} />
                    {r.published ? <Eye className="h-4 w-4 text-[var(--color-rlc-700)]" /> : <EyeOff className="h-4 w-4 text-[var(--color-ink-soft)]" />}
                  </label>
                </div>
              </label>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input label="Title (AR)" value={r.title_ar} onChange={(v) => update(r.id, { title_ar: v })} dir="rtl" />
              <Input label="Room" value={r.room ?? ''} onChange={(v) => update(r.id, { room: v })} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Input type="datetime-local" label="Starts at" value={isoToLocal(r.starts_at)} onChange={(v) => update(r.id, { starts_at: localToIso(v) ?? r.starts_at })} />
              <Input type="datetime-local" label="Ends at" value={isoToLocal(r.ends_at)} onChange={(v) => update(r.id, { ends_at: localToIso(v) })} />
              <Input type="number" label="Capacity" value={r.capacity == null ? '' : String(r.capacity)} onChange={(v) => update(r.id, { capacity: v === '' ? null : parseInt(v) })} />
              <Input type="number" label="Seats taken" value={String(r.seats_taken)} onChange={(v) => update(r.id, { seats_taken: parseInt(v) || 0 })} />
            </div>
            <div className="mt-3">
              <Input label="Registration URL" value={r.registration_url ?? ''} onChange={(v) => update(r.id, { registration_url: v })} placeholder="https://..." />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button onClick={() => save(r)} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localToIso(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}
function Input({ label, value, onChange, type = 'text', placeholder = '', dir }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir}
        className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Empty() { return <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">No schedule entries yet.</div>; }
function Spin() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />; }

/* ===================== Registered candidates modal ===================== */
/**
 * Aggregates everyone who has expressed interest in attending: approved
 * student applications (`student_applications`) plus pending/approved
 * assessment bookings (`assessment_bookings`). Displays a single roster +
 * a dashboard of level / gender / location distributions so the admin can
 * see, at a glance, the makeup of upcoming sessions.
 */
type Candidate = {
  id: string;
  source: 'application' | 'booking';
  name: string;
  email: string;
  phone: string;
  gender: string | null;
  age_group: string | null;
  location: string | null;
  level: string | null;
  language: string | null;
  status: string;
  when: string;
  student_number: number | null;
};

function CandidatesModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      const [appsRes, bookingsRes] = await Promise.all([
        sb.from('student_applications')
          .select('id, full_name, email, phone, gender, age_group, location, target_level, target_language, status, applied_at, assigned_student_number')
          .order('applied_at', { ascending: false })
          .limit(500),
        sb.from('assessment_bookings')
          .select('id, name, email, phone, age_group, status, created_at, locale')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);
      const apps: Candidate[] = ((appsRes.data ?? []) as Array<{
        id: string; full_name: string; email: string; phone: string;
        gender: string | null; age_group: string | null; location: string | null;
        target_level: string | null; target_language: string | null;
        status: string; applied_at: string; assigned_student_number: number | null;
      }>).map((r) => ({
        id: r.id, source: 'application', name: r.full_name, email: r.email, phone: r.phone,
        gender: r.gender, age_group: r.age_group, location: r.location,
        level: r.target_level, language: r.target_language, status: r.status,
        when: r.applied_at, student_number: r.assigned_student_number,
      }));
      const bookings: Candidate[] = ((bookingsRes.data ?? []) as Array<{
        id: string; name: string; email: string; phone: string;
        age_group: string | null; status: string; created_at: string;
      }>).map((r) => ({
        id: r.id, source: 'booking', name: r.name, email: r.email, phone: r.phone,
        gender: null, age_group: r.age_group, location: null,
        level: null, language: null, status: r.status,
        when: r.created_at, student_number: null,
      }));
      setCandidates([...apps, ...bookings].sort((a, b) => +new Date(b.when) - +new Date(a.when)));
      setLoading(false);
    })();
  }, []);

  const buckets = useMemo(() => {
    const by = (key: (c: Candidate) => string | null) => {
      const m = new Map<string, number>();
      candidates.forEach((c) => {
        const k = (key(c) || '—').trim() || '—';
        m.set(k, (m.get(k) ?? 0) + 1);
      });
      return Array.from(m.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };
    return {
      level:    by((c) => c.level),
      gender:   by((c) => c.gender),
      location: by((c) => (c.location || '').split(',')[0].trim() || null),
      language: by((c) => c.language),
    };
  }, [candidates]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/75 px-3 py-6 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-[var(--color-cream)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ivory)] px-5 py-4">
          <div className="min-w-0">
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">Roster &amp; dashboard</div>
            <h2 className="font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">Registered candidates</h2>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid h-32 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-rlc-700)]" />
            </div>
          ) : (
            <>
              {/* Top numbers */}
              <div className="grid gap-3 sm:grid-cols-4">
                <Box label="Total" value={candidates.length} />
                <Box label="Applications" value={candidates.filter((c) => c.source === 'application').length} />
                <Box label="Bookings" value={candidates.filter((c) => c.source === 'booking').length} />
                <Box label="Approved students" value={candidates.filter((c) => c.student_number != null).length} />
              </div>

              {/* Distribution panels */}
              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <Distribution title="Target level"    Icon={GraduationCap} entries={buckets.level} />
                <Distribution title="Gender"          Icon={Users}         entries={buckets.gender} />
                <Distribution title="Top cities"      Icon={MapPin}        entries={buckets.location} />
                <Distribution title="Language"        Icon={GraduationCap} entries={buckets.language} />
              </div>

              {/* Roster table */}
              <div className="mt-6 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-ivory)] text-left text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Contact</th>
                      <th className="px-3 py-2">Lang / Level</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Student #</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-cream)]">
                    {candidates.length === 0 && (
                      <tr><td colSpan={8} className="px-3 py-6 text-center text-[var(--color-ink-soft)]">No candidates yet.</td></tr>
                    )}
                    {candidates.slice(0, 200).map((c) => (
                      <tr key={`${c.source}-${c.id}`} className="border-t border-[var(--color-line)]">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[var(--color-ink-soft)]">{new Date(c.when).toLocaleString()}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${c.source === 'application' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]'}`}>{c.source}</span></td>
                        <td className="px-3 py-2 font-medium">{c.name}</td>
                        <td className="px-3 py-2 text-xs text-[var(--color-ink-soft)]" dir="ltr">{c.email}<br />{c.phone}</td>
                        <td className="px-3 py-2 text-xs">{[c.language, c.level].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="px-3 py-2 text-xs">{c.location ?? '—'}</td>
                        <td className="px-3 py-2"><span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{c.status}</span></td>
                        <td className="px-3 py-2 text-xs font-mono">{c.student_number ? `RLC-${c.student_number}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm bg-[var(--color-ivory)] p-4 ring-1 ring-[var(--color-line)]">
      <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</div>
      <div className="mt-1 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{value}</div>
    </div>
  );
}

function Distribution({
  title, Icon, entries,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  entries: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  const top = entries.slice(0, 5);
  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--color-gold)]" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {top.length === 0 && <li className="text-xs text-[var(--color-ink-soft)]">No data.</li>}
        {top.map((e) => (
          <li key={e.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-[var(--color-ink)]">{e.label}</span>
              <span className="ms-2 shrink-0 font-mono text-[var(--color-rlc-800)]">{e.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-ivory)]">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-rlc-800)] to-[var(--color-gold)]"
                style={{ width: `${(e.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

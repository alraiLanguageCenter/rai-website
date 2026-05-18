'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Courses and exam dates shown on the public site.</p>
        </div>
        <button onClick={createNew} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New entry
        </button>
      </div>

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

'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = { id: string; student_id: string | null; subject: string; body: string; status: string; admin_response: string | null; created_at: string };
type P = { id: string; display_name: string | null; email: string | null };

export default function AdminComplaints() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, P>>({});
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  async function load() {
    const sb = getSupabaseBrowser();
    let q = sb.from('complaints').select('*').order('created_at', { ascending: false });
    if (filter === 'open') q = q.in('status', ['open', 'reviewing']);
    else if (filter === 'resolved') q = q.in('status', ['resolved', 'dismissed']);
    const { data } = await q;
    setRows((data ?? []) as Row[]);
    const ids = (data ?? []).map((r: Row) => r.student_id).filter((x): x is string => !!x);
    if (ids.length) {
      const { data: ps } = await sb.from('profiles').select('id,display_name,email').in('id', ids);
      const m: Record<string, P> = {};
      (ps ?? []).forEach((p: P) => { m[p.id] = p; });
      setProfiles(m);
    }
  }
  useEffect(() => { load(); }, [filter]);

  async function save(r: Row) {
    const sb = getSupabaseBrowser();
    const patch: Record<string, string | null> = {
      status: r.status,
      admin_response: r.admin_response,
    };
    if (r.status === 'resolved') patch.resolved_at = new Date().toISOString();
    const { error } = await sb.from('complaints').update(patch).eq('id', r.id);
    if (error) { toast.error('Save failed'); return; }
    toast.success('Saved');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
            <MessageCircle className="h-6 w-6 text-[var(--color-gold)]" /> Complaints
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Student feedback & complaints. Resolve quickly and confidentially.</p>
        </div>
        <div className="inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
          {(['open', 'resolved', 'all'] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${filter === k ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">Nothing here.</div>}
        {(rows ?? []).map((r) => (
          <CRow key={r.id} row={r} profile={r.student_id ? profiles[r.student_id] : undefined} onSave={save} />
        ))}
      </div>
    </div>
  );
}

function CRow({ row, profile, onSave }: { row: Row; profile?: P; onSave: (r: Row) => void }) {
  const [status, setStatus] = useState(row.status);
  const [response, setResponse] = useState(row.admin_response ?? '');
  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{row.subject}</div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            {profile?.display_name ?? 'Anonymous'} · <span dir="ltr">{profile?.email ?? ''}</span> · {new Date(row.created_at).toLocaleString()}
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-sm bg-[var(--color-ivory)] p-3 text-sm text-[var(--color-ink-soft)] whitespace-pre-wrap">{row.body}</p>
      <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr_auto]">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <input value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Admin response (visible to student)…"
          className="rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
        <button onClick={() => onSave({ ...row, status, admin_response: response })} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
    </div>
  );
}

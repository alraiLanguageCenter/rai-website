'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = { id: string; student_id: string | null; kind: string; preferred_slots: string[]; notes: string | null; status: string; approved_slot: string | null; admin_notes: string | null; created_at: string };
type P = { id: string; display_name: string | null; email: string | null; phone: string | null };

export default function AdminSessionsPage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, P>>({});
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  async function load() {
    const sb = getSupabaseBrowser();
    let q = sb.from('session_requests').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data } = await q;
    setRows((data ?? []) as Row[]);
    const ids = (data ?? []).map((r: Row) => r.student_id).filter((x): x is string => !!x);
    if (ids.length) {
      const { data: ps } = await sb.from('profiles').select('id,display_name,email,phone').in('id', ids);
      const m: Record<string, P> = {};
      (ps ?? []).forEach((p: P) => { m[p.id] = p; });
      setProfiles(m);
    }
  }
  useEffect(() => { load(); }, [filter]);

  async function decide(r: Row, slot: string, status: 'approved' | 'rejected') {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('session_requests').update({
      status, approved_slot: status === 'approved' ? slot : null, decided_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast.error('Failed', { description: error.message }); return; }
    toast.success(status === 'approved' ? 'Approved' : 'Rejected');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
            <CalendarPlus className="h-6 w-6 text-[var(--color-gold)]" /> Session requests
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Approve extra and private session requests from students.</p>
        </div>
        <div className="inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
          {(['pending', 'all'] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${filter === k ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {rows === null && <div className="grid h-24 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-rlc-700)]" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">Nothing here.</div>}
        {(rows ?? []).map((r) => (
          <SRow key={r.id} row={r} profile={r.student_id ? profiles[r.student_id] : undefined} onDecide={decide} />
        ))}
      </div>
    </div>
  );
}

function SRow({ row, profile, onDecide }: { row: Row; profile?: P; onDecide: (r: Row, slot: string, s: 'approved' | 'rejected') => void }) {
  const [slot, setSlot] = useState(row.preferred_slots[0] ?? '');
  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-[var(--color-rlc-900)]">{profile?.display_name ?? 'Anonymous student'}</div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]"><span dir="ltr">{profile?.email ?? ''}</span> · <span dir="ltr">{profile?.phone ?? ''}</span></div>
        </div>
        <div className="text-xs text-[var(--color-ink-soft)]">
          <span className={`rounded-full px-2 py-0.5 ${row.status === 'approved' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]' : row.status === 'rejected' ? 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]' : 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]'}`}>{row.status}</span>
          <span className="ms-2 uppercase tracking-[0.14em]">{row.kind}</span>
        </div>
      </div>
      {row.notes && <p className="mt-3 rounded-sm bg-[var(--color-ivory)] p-3 text-sm text-[var(--color-ink-soft)]">{row.notes}</p>}

      <div className="mt-3">
        <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Preferred slots</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {row.preferred_slots.map((s) => (
            <button key={s} type="button" onClick={() => setSlot(s)} className={`rounded-full px-3 py-1.5 text-xs ${slot === s ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]'}`}>
              {new Date(s).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {row.status === 'pending' && (
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onDecide(row, slot, 'rejected')} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10"><X className="h-3.5 w-3.5" /> Reject</button>
          <button onClick={() => onDecide(row, slot, 'approved')} disabled={!slot} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button>
        </div>
      )}
    </div>
  );
}

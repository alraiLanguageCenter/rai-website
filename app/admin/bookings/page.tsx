'use client';

import { useEffect, useState } from 'react';
import { Check, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  id: string;
  name: string; email: string; phone: string;
  age_group: 'child' | 'teen' | 'adult' | 'professional';
  preferred_slots: string[];
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_slot: string | null;
  room: string | null;
  notified_email: boolean; notified_wapp: boolean;
  locale: 'ar' | 'en';
  created_at: string;
};

export default function BookingsAdmin() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    let q = sb.from('assessment_bookings').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data, error } = await q;
    if (error) { toast.error('Load failed'); return; }
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, [filter]);

  async function approve(r: Row, slot: string, room: string) {
    setBusyId(r.id);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.from('assessment_bookings').update({
        status: 'approved', approved_slot: slot, room: room || null,
        decided_at: new Date().toISOString(),
      }).eq('id', r.id);
      if (error) throw error;

      // Trigger notification through dedicated API
      const res = await fetch(`/admin/api/notify-booking?id=${r.id}`, { method: 'POST' });
      const json = await res.json();
      toast.success('Approved + notified', { description: json.summary ?? '' });
      await load();
    } catch (e) {
      toast.error('Approve failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(r: Row) {
    if (!confirm('Reject this booking?')) return;
    setBusyId(r.id);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.from('assessment_bookings').update({
        status: 'rejected', decided_at: new Date().toISOString(),
      }).eq('id', r.id);
      if (error) throw error;
      toast.success('Rejected');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Assessment bookings</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Approve a slot — student gets an email + WhatsApp message.</p>
        </div>
        <div className="inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
          {(['pending', 'all'] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${filter === k ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {rows === null && <div className="h-24 grid place-items-center"><Spin /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">Nothing here.</div>}
        {(rows ?? []).map((r) => (
          <BookingCard key={r.id} r={r} busy={busyId === r.id} onApprove={approve} onReject={reject} />
        ))}
      </div>
    </div>
  );
}

function BookingCard({ r, busy, onApprove, onReject }: { r: Row; busy: boolean; onApprove: (r: Row, slot: string, room: string) => void; onReject: (r: Row) => void }) {
  const [slot, setSlot] = useState<string>(r.preferred_slots[0] ?? new Date().toISOString());
  const [room, setRoom] = useState(r.room ?? '');
  const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">{r.name}</div>
          <div className="mt-1 text-sm text-[var(--color-ink-soft)]" dir="ltr">{r.email} · {r.phone}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            {r.age_group} · {r.locale.toUpperCase()} · {dateFmt.format(new Date(r.created_at))}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] ${
          r.status === 'pending' ? 'bg-[var(--color-gold-soft)] text-[var(--color-rlc-900)]'
            : r.status === 'approved' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]'
            : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)]'
        }`}>{r.status}</span>
      </div>
      {r.notes && <p className="mt-3 rounded-sm bg-[var(--color-ivory)] p-3 text-sm text-[var(--color-ink-soft)]">{r.notes}</p>}

      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Preferred slots</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {r.preferred_slots.map((s) => (
            <button key={s} type="button" onClick={() => setSlot(s)}
              className={`rounded-full px-3 py-1.5 text-xs ${slot === s ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]'}`}>
              {dateFmt.format(new Date(s))}
            </button>
          ))}
        </div>
      </div>

      {r.status === 'pending' && (
        <div className="mt-5 grid gap-3 rounded-sm bg-[var(--color-ivory)] p-4 md:grid-cols-[1fr_180px_auto]">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Confirmed slot</span>
            <input type="datetime-local" value={isoToLocal(slot)} onChange={(e) => setSlot(new Date(e.target.value).toISOString())}
              className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-cream)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Room</span>
            <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A2"
              className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-cream)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
          </label>
          <div className="flex items-end gap-2">
            <button onClick={() => onReject(r)} disabled={busy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10 disabled:opacity-50">
              <X className="h-3.5 w-3.5" /> Reject
            </button>
            <button onClick={() => onApprove(r, slot, room)} disabled={busy}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve + notify
            </button>
          </div>
        </div>
      )}

      {r.status === 'approved' && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-sm bg-[var(--color-rlc-100)] p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">Confirmed</div>
            <div className="mt-1 font-medium">{r.approved_slot ? dateFmt.format(new Date(r.approved_slot)) : '—'}{r.room ? ` · Room ${r.room}` : ''}</div>
          </div>
          <div className="rounded-sm bg-[var(--color-rlc-100)] p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">Notifications</div>
            <div className="mt-1 inline-flex items-center gap-3 text-xs">
              <span className={r.notified_email ? 'text-[var(--color-rlc-700)]' : 'text-[var(--color-ink-soft)]'}>{r.notified_email ? '✓' : '·'} Email</span>
              <span className={r.notified_wapp ? 'text-[var(--color-rlc-700)]' : 'text-[var(--color-ink-soft)]'}>{r.notified_wapp ? '✓' : '·'} WhatsApp</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function Spin() { return <Loader2 className="h-6 w-6 animate-spin text-[var(--color-rlc-700)]" />; }

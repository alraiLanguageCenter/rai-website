'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Req = { id: string; kind: string; preferred_slots: string[]; notes: string | null; status: string; approved_slot: string | null; created_at: string };

export default function StudentSessionsPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [kind, setKind] = useState<'extra' | 'private' | 'makeup'>('extra');
  const [slots, setSlots] = useState<string[]>(['', '', '']);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data } = await sb.from('session_requests').select('*').eq('student_id', u.user.id).order('created_at', { ascending: false });
    setReqs((data ?? []) as Req[]);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    const filled = slots.filter(Boolean).map((s) => new Date(s).toISOString());
    if (filled.length === 0) { toast.error('Pick at least one slot'); return; }
    setSaving(true);
    try {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      const { error } = await sb.from('session_requests').insert({
        student_id: u.user?.id, kind, preferred_slots: filled, notes: notes || null,
      });
      if (error) throw error;
      toast.success('Request sent');
      setSlots(['', '', '']); setNotes('');
      load();
    } catch (e) {
      toast.error('Failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
        <CalendarPlus className="h-7 w-7 text-[var(--color-gold)]" /> Sessions
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Request an extra group session, a private session, or a make-up class.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <h2 className="font-semibold text-[var(--color-rlc-900)]">New request</h2>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Type</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as 'extra' | 'private' | 'makeup')}
              className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
              <option value="extra">Extra group session</option>
              <option value="private">Private 1-on-1 session</option>
              <option value="makeup">Make-up class</option>
            </select>
          </label>
          <div className="mt-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Preferred slots</span>
            <div className="mt-1.5 space-y-2">
              {slots.map((s, i) => (
                <input key={i} type="datetime-local" value={s} onChange={(e) => setSlots(slots.map((x, j) => j === i ? e.target.value : x))} dir="ltr"
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
              ))}
            </div>
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="mt-1.5 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
          </label>
          <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
            <Plus className="h-4 w-4" /> Send request
          </button>
        </div>

        <div>
          <h2 className="font-semibold text-[var(--color-rlc-900)]">My requests</h2>
          <div className="mt-4 grid gap-2">
            {reqs === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
            {reqs?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-6 text-sm text-[var(--color-ink-soft)]">No requests yet.</div>}
            {(reqs ?? []).map((r) => (
              <div key={r.id} className="rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.kind}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.14em] ${
                    r.status === 'approved' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]'
                      : r.status === 'rejected' ? 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'
                      : 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]'
                  }`}>{r.status}</span>
                </div>
                {r.approved_slot && <div className="mt-1 text-xs text-[var(--color-rlc-700)]">Confirmed: {new Date(r.approved_slot).toLocaleString()}</div>}
                {r.notes && <div className="mt-2 text-xs text-[var(--color-ink-soft)]">{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

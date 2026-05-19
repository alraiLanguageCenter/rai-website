'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { StudentShell } from '@/components/portal/StudentShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = { id: string; subject: string; body: string; status: string; admin_response: string | null; created_at: string };

export default function StudentComplaintsPage() {
  return <StudentShell><Body /></StudentShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data } = await sb.from('complaints').select('*').eq('student_id', u.user.id).order('created_at', { ascending: false });
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!subject.trim() || !body.trim()) { toast.error('Both fields required'); return; }
    setSaving(true);
    try {
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      const { error } = await sb.from('complaints').insert({
        student_id: u.user?.id, subject, body,
      });
      if (error) throw error;
      toast.success('Submitted. Our team will review.');
      setSubject(''); setBody('');
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
        <MessageCircle className="h-7 w-7 text-[var(--color-gold)]" /> Complaints
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Tell us privately. We respond quickly and confidentially.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <h2 className="font-semibold text-[var(--color-rlc-900)]">New complaint</h2>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Details</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5}
              className="mt-1.5 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
          </label>
          <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
            <Plus className="h-4 w-4" /> Submit
          </button>
        </div>

        <div>
          <h2 className="font-semibold text-[var(--color-rlc-900)]">My complaints</h2>
          <div className="mt-4 grid gap-2">
            {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
            {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-6 text-sm text-[var(--color-ink-soft)]">No complaints yet.</div>}
            {(rows ?? []).map((c) => (
              <div key={c.id} className="rounded-sm bg-[var(--color-cream)] p-4 ring-1 ring-[var(--color-line)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{c.subject}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.14em] ${
                    c.status === 'resolved' ? 'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]'
                      : c.status === 'reviewing' ? 'bg-[var(--color-gold)]/15 text-[var(--color-rlc-900)]'
                      : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)]'
                  }`}>{c.status}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{c.body}</p>
                {c.admin_response && <div className="mt-3 rounded-sm bg-[var(--color-rlc-100)] p-3 text-xs"><strong>Reply: </strong>{c.admin_response}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

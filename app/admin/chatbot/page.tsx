'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  active: boolean;
  sort_order: number;
};

export default function ChatbotAdmin() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('chatbot_knowledge').select('*').order('sort_order', { ascending: true });
    if (error) { toast.error('Load failed'); return; }
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function createNew() {
    const sb = getSupabaseBrowser();
    const { error, data } = await sb.from('chatbot_knowledge').insert({
      topic: 'New topic', question: 'New question?', answer: 'New answer', active: false,
      sort_order: (rows?.length ?? 0) + 1,
    }).select('*').single();
    if (error) { toast.error('Create failed'); return; }
    setRows((rs) => [...(rs ?? []), data as Row]);
  }

  async function save(r: Row) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('chatbot_knowledge').update({
      topic: r.topic, question: r.question, answer: r.answer,
      active: r.active, sort_order: r.sort_order,
      updated_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }

  async function remove(id: string) {
    if (!confirm('Delete this knowledge entry?')) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('chatbot_knowledge').delete().eq('id', id);
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
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Chatbot knowledge</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Question / answer snippets the AI chatbot uses to answer visitors. Active entries are sent to the model on every reply.
          </p>
        </div>
        <button onClick={createNew} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New entry
        </button>
      </div>

      <div className="mt-8 grid gap-4">
        {rows === null && <div className="h-24 grid place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">No entries yet — click <strong>New entry</strong> to start.</div>}
        {(rows ?? []).map((r) => (
          <div key={r.id} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
            <div className="grid gap-3 md:grid-cols-[160px_1fr_100px]">
              <Input label="Topic" value={r.topic} onChange={(v) => update(r.id, { topic: v })} />
              <Input label="Question" value={r.question} onChange={(v) => update(r.id, { question: v })} />
              <Input type="number" label="Sort" value={String(r.sort_order)} onChange={(v) => update(r.id, { sort_order: parseInt(v) || 0 })} />
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Answer</span>
              <textarea value={r.answer} onChange={(e) => update(r.id, { answer: e.target.value })} rows={4}
                className="mt-1.5 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
            </label>
            <div className="mt-4 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={r.active} onChange={(e) => update(r.id, { active: e.target.checked })} />
                {r.active ? <><Eye className="h-4 w-4 text-[var(--color-rlc-700)]" /> Active</> : <><EyeOff className="h-4 w-4 text-[var(--color-ink-soft)]" /> Disabled</>}
              </label>
              <div className="flex gap-2">
                <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button onClick={() => save(r)} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
    </label>
  );
}

export const ChatbotIcon = MessageSquare;

'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  id: string;
  title_ar: string; title_en: string;
  body_ar: string | null; body_en: string | null;
  flyer_url: string | null;
  cta_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null;
  starts_at: string | null; ends_at: string | null;
  published: boolean;
  sort_order: number;
};

export default function AnnouncementsAdmin() {
  return <AdminShell><AnnouncementsBody /></AdminShell>;
}

function AnnouncementsBody() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('announcements').select('*').order('sort_order', { ascending: true });
    if (error) { toast.error('Load failed', { description: error.message }); return; }
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { load(); }, []);

  async function createNew() {
    const sb = getSupabaseBrowser();
    const { error, data } = await sb.from('announcements').insert({
      title_ar: 'إعلان جديد', title_en: 'New announcement', published: false,
    }).select('*').single();
    if (error) { toast.error('Create failed'); return; }
    setRows((rs) => [data as Row, ...(rs ?? [])]);
  }

  async function save(row: Row) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('announcements').update({
      title_ar: row.title_ar, title_en: row.title_en,
      body_ar: row.body_ar, body_en: row.body_en,
      flyer_url: row.flyer_url, cta_url: row.cta_url,
      cta_label_ar: row.cta_label_ar, cta_label_en: row.cta_label_en,
      starts_at: row.starts_at, ends_at: row.ends_at,
      published: row.published, sort_order: row.sort_order,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('announcements').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    setRows((rs) => (rs ?? []).filter((r) => r.id !== id));
  }

  async function uploadFlyer(id: string, file: File) {
    const sb = getSupabaseBrowser();
    const path = `flyers/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const up = await sb.storage.from('flyers').upload(path, file, { upsert: true });
    if (up.error) { toast.error('Upload failed', { description: up.error.message }); return; }
    const { data: pub } = sb.storage.from('flyers').getPublicUrl(path);
    setRows((rs) => (rs ?? []).map((r) => r.id === id ? { ...r, flyer_url: pub.publicUrl } : r));
    await save({ ...(rows!.find((r) => r.id === id)!), flyer_url: pub.publicUrl });
  }

  function update(id: string, patch: Partial<Row>) {
    setRows((rs) => (rs ?? []).map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Announcements</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Flyers and news visible on the public site.</p>
        </div>
        <button onClick={createNew}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New announcement
        </button>
      </div>

      <div className="mt-8 grid gap-6">
        {rows === null && <div className="h-24 grid place-items-center"><Spin /></div>}
        {rows?.length === 0 && <Empty />}
        {(rows ?? []).map((r) => (
          <article key={r.id} className="rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[var(--color-ivory)] ring-1 ring-[var(--color-line)]">
                  {r.flyer_url ? (
                    <img src={r.flyer_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-[var(--color-ink-soft)]">
                      <ImageIcon className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-ivory)] px-3 py-2 text-xs font-medium ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]">
                  <ImageIcon className="h-3.5 w-3.5" /> Upload flyer
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (f) uploadFlyer(r.id, f);
                  }} />
                </label>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Title (AR)" value={r.title_ar} onChange={(v) => update(r.id, { title_ar: v })} dir="rtl" />
                  <Input label="Title (EN)" value={r.title_en} onChange={(v) => update(r.id, { title_en: v })} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Textarea label="Body (AR)" value={r.body_ar ?? ''} onChange={(v) => update(r.id, { body_ar: v })} dir="rtl" />
                  <Textarea label="Body (EN)" value={r.body_en ?? ''} onChange={(v) => update(r.id, { body_en: v })} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="CTA URL" value={r.cta_url ?? ''} onChange={(v) => update(r.id, { cta_url: v })} placeholder="https://..." />
                  <Input label="CTA label (AR)" value={r.cta_label_ar ?? ''} onChange={(v) => update(r.id, { cta_label_ar: v })} dir="rtl" />
                  <Input label="CTA label (EN)" value={r.cta_label_en ?? ''} onChange={(v) => update(r.id, { cta_label_en: v })} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input type="datetime-local" label="Starts at" value={isoToLocal(r.starts_at)} onChange={(v) => update(r.id, { starts_at: localToIso(v) })} />
                  <Input type="datetime-local" label="Ends at" value={isoToLocal(r.ends_at)} onChange={(v) => update(r.id, { ends_at: localToIso(v) })} />
                  <Input type="number" label="Sort order" value={String(r.sort_order)} onChange={(v) => update(r.id, { sort_order: parseInt(v) || 0 })} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={r.published} onChange={(e) => update(r.id, { published: e.target.checked })} />
                    {r.published ? <><Eye className="h-4 w-4 text-[var(--color-rlc-700)]" /> Published</> : <><EyeOff className="h-4 w-4 text-[var(--color-ink-soft)]" /> Draft</>}
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
            </div>

            {/* Live preview — shows the EN side of how this announcement will look
                on the public site, matching the real card styling. */}
            <div className="mt-6 border-t border-[var(--color-line)] pt-5">
              <div className="mb-3 text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                Preview on the public site (EN)
              </div>
              <LivePreview row={r} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Live preview card -------------------- */
function LivePreview({ row }: { row: Row }) {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-md bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] shadow-[0_18px_40px_-24px_rgba(8,57,34,0.35)]">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[var(--color-rlc-800)] via-[var(--color-rlc-700)] to-[var(--color-rlc-900)] sm:h-36">
        {row.flyer_url ? (
          <img src={row.flyer_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0">
            <span aria-hidden className="absolute -end-8 -top-8 h-28 w-28 rounded-full bg-[var(--color-gold)]/25 blur-2xl" />
            <span aria-hidden className="absolute -start-10 -bottom-8 h-24 w-24 rounded-full bg-[var(--color-rlc-700)]/40 blur-2xl" />
            <div className="absolute inset-0 grid place-items-center font-[var(--font-display)] text-[5rem] leading-none text-[var(--color-gold)]/25 sm:text-[6rem]">✦</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/80 via-[var(--color-rlc-900)]/25 to-transparent" />
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-rlc-900)] shadow-[0_8px_18px_-8px_rgba(201,162,74,0.7)]">
          New
        </span>
        {!row.published && (
          <span className="absolute end-3 top-3 rounded-full bg-[var(--color-rose)] px-2 py-0.5 text-[0.6rem] font-bold uppercase text-white">
            Draft (hidden)
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-[var(--font-display)] text-lg leading-tight text-[var(--color-rlc-900)] sm:text-xl">
          {row.title_en || <span className="italic text-[var(--color-ink-soft)]">No title yet</span>}
        </h3>
        {row.body_en && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{row.body_en}</p>
        )}
        {row.cta_url && (
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-rlc-800)]">
              {row.cta_label_en || 'View flyer'} →
            </span>
          </div>
        )}
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
function Textarea({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir?: 'ltr' | 'rtl' }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} dir={dir}
        className="mt-1.5 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
    </label>
  );
}
function Empty() {
  return (
    <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
      No announcements yet. Click <strong>New announcement</strong> to create one.
    </div>
  );
}
function Spin() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />; }

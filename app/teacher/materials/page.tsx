'use client';

import { useEffect, useState } from 'react';
import { Upload, Trash2, ExternalLink, Library } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Material = { id: string; title: string; url: string; kind: string; visibility: string; class_id: string | null; created_at: string };

export default function TeacherMaterialsPage() {
  return <TeacherShell><Body /></TeacherShell>;
}

function Body() {
  const [rows, setRows] = useState<Material[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data } = await sb.from('lesson_materials').select('*').eq('teacher_id', u.user.id).order('created_at', { ascending: false });
    setRows((data ?? []) as Material[]);
  }
  useEffect(() => { load(); }, []);

  async function uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const sb = getSupabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      const path = `materials/${u.user?.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const up = await sb.storage.from('flyers').upload(path, file, { upsert: true });
      if (up.error) { toast.error('Upload failed', { description: up.error.message }); return; }
      const { data: pub } = sb.storage.from('flyers').getPublicUrl(path);
      const title = prompt('Material title?', file.name) || file.name;
      const visibility = (prompt("Visibility? 'class' / 'all' / 'private'", 'all') || 'all') as string;
      const { error } = await sb.from('lesson_materials').insert({
        title, url: pub.publicUrl, teacher_id: u.user?.id,
        kind: file.type.includes('pdf') ? 'pdf' : 'document', visibility,
      });
      if (error) { toast.error('Save failed', { description: error.message }); return; }
      toast.success('Uploaded');
      load();
    };
    input.click();
  }

  async function addLink() {
    const title = prompt('Title?'); if (!title) return;
    const url = prompt('URL?'); if (!url) return;
    const visibility = (prompt("Visibility? 'class' / 'all' / 'private'", 'all') || 'all') as string;
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    const { error } = await sb.from('lesson_materials').insert({
      title, url, teacher_id: u.user?.id, kind: 'link', visibility,
    });
    if (error) { toast.error('Save failed'); return; }
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete?')) return;
    const sb = getSupabaseBrowser();
    await sb.from('lesson_materials').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">My Materials</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">PDFs, documents, and links shared with your students.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addLink} className="inline-flex items-center gap-2 rounded-full ring-1 ring-[var(--color-rlc-800)]/30 bg-[var(--color-cream)] px-4 py-2 text-xs font-medium text-[var(--color-rlc-800)] hover:bg-[var(--color-rlc-100)]">
            <ExternalLink className="h-3.5 w-3.5" /> Add link
          </button>
          <button onClick={uploadFile} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
            <Upload className="h-4 w-4" /> Upload file
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {rows === null && <div className="grid h-24 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>}
        {rows?.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-12 text-center text-[var(--color-ink-soft)]">No materials yet.</div>}
        {(rows ?? []).map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)]">
            <Library className="h-4 w-4 text-[var(--color-gold)]" />
            <span className="flex-1">{m.title}</span>
            <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]">{m.kind}</span>
            <span className="rounded-full bg-[var(--color-rlc-100)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">{m.visibility}</span>
            <a href={m.url} target="_blank" rel="noreferrer noopener" className="text-[var(--color-rlc-800)]"><ExternalLink className="h-4 w-4" /></a>
            <button onClick={() => remove(m.id)} className="text-[var(--color-rose)]"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

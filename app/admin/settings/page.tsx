'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Lock, Sparkles, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Row = {
  key: string;
  value: unknown;
  description: string | null;
  is_secret: boolean;
  updated_at: string;
};

const GROUPS: { id: string; label: string; keys: string[]; Icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 'ai',
    label: 'AI & Chatbot',
    Icon: Sparkles,
    keys: ['chatbot_model', 'chatbot_temperature', 'chatbot_max_tokens', 'assessment_model', 'deepseek_api_key'],
  },
  {
    id: 'notify',
    label: 'Notifications',
    Icon: SettingsIcon,
    keys: ['admin_inbox', 'whatsapp_phone', 'resend_api_key'],
  },
  {
    id: 'site',
    label: 'Site',
    Icon: SettingsIcon,
    keys: ['site_url', 'registration_open'],
  },
];

export default function AdminSettingsPage() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('system_settings').select('*').order('key');
    if (error) { toast.error('Load failed', { description: error.message }); setRows([]); return; }
    const arr = (data ?? []) as Row[];
    setRows(arr);
    const next: Record<string, string> = {};
    arr.forEach((r) => { next[r.key] = stringifyJson(r.value); });
    setDrafts(next);
  }
  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSavingKey(key);
    try {
      const sb = getSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      let parsed: unknown;
      try {
        parsed = JSON.parse(drafts[key] ?? '""');
      } catch {
        // Treat as raw string if not valid JSON (most settings are strings, this is forgiving)
        parsed = drafts[key];
      }
      const { error } = await sb.from('system_settings').update({
        value: parsed,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      }).eq('key', key);
      if (error) throw error;
      toast.success(`Saved ${key}`);
      await load();
    } catch (e) {
      toast.error('Save failed', { description: e instanceof Error ? e.message : '' });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
            <SettingsIcon className="h-7 w-7 text-[var(--color-gold)]" /> System settings
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Configuration that powers Nouha (chatbot, tutor, assessment), email and WhatsApp notifications, and the public site.
            Secret keys are stored encrypted in the database. Leave a key blank to fall back to the environment variable.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ivory)] px-3 py-2 text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]"
        >
          <RotateCw className="h-3.5 w-3.5" /> Reload
        </button>
      </div>

      <div className="mt-8 grid gap-8">
        {GROUPS.map((g) => {
          const groupRows = (rows ?? []).filter((r) => g.keys.includes(r.key));
          if (groupRows.length === 0) return null;
          return (
            <section key={g.id} className="rounded-md bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
              <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
                <g.Icon className="h-5 w-5 text-[var(--color-gold)]" />
                {g.label}
              </h2>
              <div className="mt-4 grid gap-4">
                {groupRows.map((r) => (
                  <SettingRow
                    key={r.key}
                    row={r}
                    draft={drafts[r.key] ?? ''}
                    onDraft={(v) => setDrafts((d) => ({ ...d, [r.key]: v }))}
                    onSave={() => save(r.key)}
                    saving={savingKey === r.key}
                    showSecret={!!showSecret[r.key]}
                    onToggleSecret={() => setShowSecret((s) => ({ ...s, [r.key]: !s[r.key] }))}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Any other (unknown) keys */}
        {(() => {
          const known = new Set(GROUPS.flatMap((g) => g.keys));
          const extras = (rows ?? []).filter((r) => !known.has(r.key));
          if (extras.length === 0) return null;
          return (
            <section className="rounded-md bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)]">
              <h2 className="font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">Other</h2>
              <div className="mt-4 grid gap-4">
                {extras.map((r) => (
                  <SettingRow
                    key={r.key}
                    row={r}
                    draft={drafts[r.key] ?? ''}
                    onDraft={(v) => setDrafts((d) => ({ ...d, [r.key]: v }))}
                    onSave={() => save(r.key)}
                    saving={savingKey === r.key}
                    showSecret={!!showSecret[r.key]}
                    onToggleSecret={() => setShowSecret((s) => ({ ...s, [r.key]: !s[r.key] }))}
                  />
                ))}
              </div>
            </section>
          );
        })()}

        {rows === null && (
          <div className="grid h-24 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-rlc-700)]" />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  row, draft, onDraft, onSave, saving, showSecret, onToggleSecret,
}: {
  row: Row;
  draft: string;
  onDraft: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  showSecret: boolean;
  onToggleSecret: () => void;
}) {
  const isSecret = row.is_secret;
  const masked = isSecret && !showSecret;
  const long = draft.length > 64 || draft.includes('\n');

  return (
    <div className="grid gap-2 sm:grid-cols-[260px_1fr_auto] sm:items-start">
      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-rlc-900)]">
          {isSecret && <Lock className="h-3.5 w-3.5 text-[var(--color-gold)]" />}
          {row.key}
        </div>
        {row.description && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{row.description}</p>}
        <div className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--color-ink-soft)]/70">
          updated {new Date(row.updated_at).toLocaleString()}
        </div>
      </div>
      <div className="relative">
        {long ? (
          <textarea
            value={masked ? '••••••••••••' : draft}
            disabled={masked}
            onChange={(e) => onDraft(e.target.value)}
            rows={4}
            className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 font-mono text-xs ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)] disabled:opacity-70"
            dir="ltr"
          />
        ) : (
          <input
            type="text"
            value={masked ? '••••••••••••' : draft}
            disabled={masked}
            onChange={(e) => onDraft(e.target.value)}
            className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 font-mono text-xs ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)] disabled:opacity-70"
            dir="ltr"
          />
        )}
        {isSecret && (
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-[var(--color-line)]/40"
            aria-label={showSecret ? 'Hide' : 'Reveal'}
          >
            {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={saving || masked}
        className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save
      </button>
    </div>
  );
}

function stringifyJson(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value);
}

'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, FileQuestion, GraduationCap, Library, Sparkles, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Question = {
  id: string;
  prompt_en: string; prompt_ar: string;
  options: { en: string; ar: string }[];
  correct_idx: number;
  difficulty: number;
  skill_tag: string | null;
  sort_order: number;
  active: boolean;
};
type Level = { code: string; label_en: string; label_ar: string; min_score: number; description_en: string | null; description_ar: string | null; sort_order: number };
type Rec = { id: string; level_code: string; age_group: string | null; books: string[]; course_slug: string | null; notes_en: string | null; notes_ar: string | null };

const TABS = [
  { id: 'questions', label: 'Questions', Icon: FileQuestion },
  { id: 'levels', label: 'Levels', Icon: GraduationCap },
  { id: 'recs', label: 'Recommendations', Icon: Library },
] as const;

export default function QuizCMS() {
  return <AdminShell><Body /></AdminShell>;
}

function Body() {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('questions');
  return (
    <div>
      <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">Quiz CMS</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Questions, levels, and book recommendations for the free placement test.</p>

      <div className="mt-6 inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
        {TABS.map((tt) => (
          <button key={tt.id} onClick={() => setTab(tt.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${tab === tt.id ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]'}`}>
            <tt.Icon className="h-3.5 w-3.5" /> {tt.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'questions' && <QuestionsPanel />}
        {tab === 'levels' && <LevelsPanel />}
        {tab === 'recs' && <RecsPanel />}
      </div>
    </div>
  );
}

function QuestionsPanel() {
  const [rows, setRows] = useState<Question[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('quiz_questions').select('*').order('sort_order', { ascending: true });
    if (error) { toast.error('Load failed'); return; }
    setRows((data ?? []) as Question[]);
  }
  useEffect(() => { load(); }, []);

  async function createNew() {
    const sb = getSupabaseBrowser();
    const { error, data } = await sb.from('quiz_questions').insert({
      prompt_en: 'New question', prompt_ar: 'سؤال جديد',
      options: [{ en: 'A', ar: 'A' }, { en: 'B', ar: 'B' }, { en: 'C', ar: 'C' }, { en: 'D', ar: 'D' }],
      correct_idx: 0, difficulty: 1, sort_order: (rows?.length ?? 0) + 1, active: true,
    }).select('*').single();
    if (error) { toast.error('Create failed'); return; }
    setRows((rs) => [...(rs ?? []), data as Question]);
  }
  async function save(q: Question) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('quiz_questions').update({
      prompt_en: q.prompt_en, prompt_ar: q.prompt_ar, options: q.options, correct_idx: q.correct_idx,
      difficulty: q.difficulty, skill_tag: q.skill_tag, sort_order: q.sort_order, active: q.active,
    }).eq('id', q.id);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }
  async function remove(id: string) {
    if (!confirm('Delete question?')) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('quiz_questions').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    setRows((rs) => (rs ?? []).filter((r) => r.id !== id));
  }
  function update(id: string, patch: Partial<Question>) {
    setRows((rs) => (rs ?? []).map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  const [aiOpen, setAiOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={() => setAiOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-bright)] px-5 py-2.5 text-sm font-semibold text-[var(--color-rlc-900)] shadow-[0_12px_28px_-12px_rgba(201,162,74,0.55)] transition hover:-translate-y-0.5">
          <Sparkles className="h-4 w-4" /> Generate with AI
        </button>
        <button onClick={createNew}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New question
        </button>
      </div>
      <AnimatePresence>
        {aiOpen && <GenerateModal onClose={() => setAiOpen(false)} onInserted={() => { setAiOpen(false); load(); }} />}
      </AnimatePresence>
      <div className="mt-5 grid gap-4">
        {rows === null && <Spin />}
        {(rows ?? []).map((q) => (
          <div key={q.id} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_100px]">
              <Input label="Prompt (EN)" value={q.prompt_en} onChange={(v) => update(q.id, { prompt_en: v })} />
              <Input type="number" label="Difficulty" value={String(q.difficulty)} onChange={(v) => update(q.id, { difficulty: Math.max(1, Math.min(3, parseInt(v) || 1)) })} />
              <Input label="Skill tag" value={q.skill_tag ?? ''} onChange={(v) => update(q.id, { skill_tag: v })} placeholder="grammar/vocab/reading" />
              <Input type="number" label="Sort" value={String(q.sort_order)} onChange={(v) => update(q.id, { sort_order: parseInt(v) || 0 })} />
            </div>
            <div className="mt-3">
              <Input label="Prompt (AR)" value={q.prompt_ar} onChange={(v) => update(q.id, { prompt_ar: v })} dir="rtl" />
            </div>
            <div className="mt-4 grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Options</div>
              {q.options.map((o, i) => (
                <div key={i} className="grid items-center gap-2 md:grid-cols-[28px_1fr_1fr_80px]">
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input type="radio" name={`correct-${q.id}`} checked={q.correct_idx === i}
                      onChange={() => update(q.id, { correct_idx: i })} />
                  </label>
                  <input value={o.en} onChange={(e) => {
                    const opts = [...q.options]; opts[i] = { ...opts[i], en: e.target.value };
                    update(q.id, { options: opts });
                  }} placeholder={`Option ${String.fromCharCode(65 + i)} (EN)`}
                    className="rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
                  <input value={o.ar} dir="rtl" onChange={(e) => {
                    const opts = [...q.options]; opts[i] = { ...opts[i], ar: e.target.value };
                    update(q.id, { options: opts });
                  }} placeholder={`Option ${String.fromCharCode(65 + i)} (AR)`}
                    className="rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
                  <button onClick={() => {
                    const opts = q.options.filter((_, idx) => idx !== i);
                    update(q.id, { options: opts, correct_idx: Math.max(0, Math.min(opts.length - 1, q.correct_idx)) });
                  }} className="text-xs text-[var(--color-rose)] hover:underline">remove</button>
                </div>
              ))}
              {q.options.length < 5 && (
                <button onClick={() => update(q.id, { options: [...q.options, { en: '', ar: '' }] })}
                  className="self-start text-xs font-medium text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]">
                  + add option
                </button>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={q.active} onChange={(e) => update(q.id, { active: e.target.checked })} />
                {q.active ? <><Eye className="h-4 w-4 text-[var(--color-rlc-700)]" /> Active</> : <><EyeOff className="h-4 w-4 text-[var(--color-ink-soft)]" /> Disabled</>}
              </label>
              <div className="flex gap-2">
                <button onClick={() => remove(q.id)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button onClick={() => save(q)} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
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

function LevelsPanel() {
  const [rows, setRows] = useState<Level[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('quiz_levels').select('*').order('sort_order', { ascending: true });
    if (error) { toast.error('Load failed'); return; }
    setRows((data ?? []) as Level[]);
  }
  useEffect(() => { load(); }, []);
  async function save(l: Level) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('quiz_levels').update({
      label_en: l.label_en, label_ar: l.label_ar, min_score: l.min_score,
      description_en: l.description_en, description_ar: l.description_ar, sort_order: l.sort_order,
    }).eq('code', l.code);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }
  function update(code: string, patch: Partial<Level>) {
    setRows((rs) => (rs ?? []).map((r) => r.code === code ? { ...r, ...patch } : r));
  }

  return (
    <div className="grid gap-4">
      {rows === null && <Spin />}
      {(rows ?? []).map((l) => (
        <div key={l.code} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
          <div className="grid gap-3 md:grid-cols-[80px_1fr_1fr_120px]">
            <div className="grid place-items-center rounded-sm bg-[var(--color-gold)]/15 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{l.code}</div>
            <Input label="Label (EN)" value={l.label_en} onChange={(v) => update(l.code, { label_en: v })} />
            <Input label="Label (AR)" value={l.label_ar} onChange={(v) => update(l.code, { label_ar: v })} dir="rtl" />
            <Input type="number" label="Min score" value={String(l.min_score)} onChange={(v) => update(l.code, { min_score: parseInt(v) || 0 })} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input label="Description (EN)" value={l.description_en ?? ''} onChange={(v) => update(l.code, { description_en: v })} />
            <Input label="Description (AR)" value={l.description_ar ?? ''} onChange={(v) => update(l.code, { description_ar: v })} dir="rtl" />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => save(l)} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecsPanel() {
  const [rows, setRows] = useState<Rec[] | null>(null);

  async function load() {
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.from('quiz_recommendations').select('*').order('level_code', { ascending: true });
    if (error) { toast.error('Load failed'); return; }
    setRows((data ?? []) as Rec[]);
  }
  useEffect(() => { load(); }, []);
  async function createNew() {
    const sb = getSupabaseBrowser();
    const { error, data } = await sb.from('quiz_recommendations').insert({ level_code: 'A1', books: [] }).select('*').single();
    if (error) { toast.error('Create failed'); return; }
    setRows((rs) => [...(rs ?? []), data as Rec]);
  }
  async function save(r: Rec) {
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('quiz_recommendations').update({
      level_code: r.level_code, age_group: r.age_group, books: r.books,
      course_slug: r.course_slug, notes_en: r.notes_en, notes_ar: r.notes_ar,
    }).eq('id', r.id);
    if (error) { toast.error('Save failed', { description: error.message }); return; }
    toast.success('Saved');
  }
  async function remove(id: string) {
    if (!confirm('Delete recommendation?')) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from('quiz_recommendations').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    setRows((rs) => (rs ?? []).filter((r) => r.id !== id));
  }
  function update(id: string, patch: Partial<Rec>) {
    setRows((rs) => (rs ?? []).map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={createNew}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
          <Plus className="h-4 w-4" /> New recommendation
        </button>
      </div>
      <div className="mt-5 grid gap-4">
        {rows === null && <Spin />}
        {(rows ?? []).map((r) => (
          <div key={r.id} className="rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)]">
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Level code" value={r.level_code} onChange={(v) => update(r.id, { level_code: v })} placeholder="A1..C2" />
              <Input label="Age group (optional)" value={r.age_group ?? ''} onChange={(v) => update(r.id, { age_group: v })} placeholder="child/teen/adult/professional" />
              <Input label="Course slug" value={r.course_slug ?? ''} onChange={(v) => update(r.id, { course_slug: v })} />
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Books (one per line)</span>
              <textarea value={r.books.join('\n')} rows={4} onChange={(e) => update(r.id, { books: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                className="mt-1.5 w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input label="Notes (EN)" value={r.notes_en ?? ''} onChange={(v) => update(r.id, { notes_en: v })} />
              <Input label="Notes (AR)" value={r.notes_ar ?? ''} onChange={(v) => update(r.id, { notes_ar: v })} dir="rtl" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
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

function Input({ label, value, onChange, type = 'text', placeholder = '', dir }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir}
        className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
    </label>
  );
}
function Spin() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />; }

/* -------------------- AI generation modal -------------------- */

function GenerateModal({ onClose, onInserted }: { onClose: () => void; onInserted: () => void }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [skillTag, setSkillTag] = useState<'grammar' | 'vocab' | 'reading' | 'speaking' | 'writing'>('grammar');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'mixed'>('mixed');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  async function generate() {
    if (!topic.trim()) { toast.error('Pick a topic'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/quiz-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count, difficulty, skillTag, level, active: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        toast.success(`Inserted ${json.inserted} question(s) on "${json.topic}"`);
        onInserted();
      } else {
        toast.error(json.error || `Generation failed (HTTP ${res.status})`);
      }
    } catch {
      toast.error('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  const SUGGESTIONS = [
    'present simple tense', 'past simple vs past continuous', 'articles a/an/the',
    'prepositions of time', 'conditionals (if-clauses)', 'business email vocabulary',
    'travel and tourism vocabulary', 'phrasal verbs', 'reported speech',
    'modal verbs (can/could/should)', 'comparatives and superlatives',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-ink)]/75 px-4 py-6 backdrop-blur-md"
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-md bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        <button onClick={onClose} disabled={busy}
          className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]">
          <X className="h-4 w-4" />
        </button>
        <h2 className="inline-flex items-center gap-2 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">
          <Sparkles className="h-5 w-5 text-[var(--color-gold)]" /> Generate questions with AI
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Nouha will write {count} placement-test question{count > 1 ? 's' : ''} on your topic, bilingual EN + AR, and append them to the bank.
        </p>

        <div className="mt-5 grid gap-4">
          <Input label="Topic" value={topic} onChange={setTopic} placeholder="e.g. present simple tense, business email vocabulary" />
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setTopic(s)}
                className="rounded-full bg-[var(--color-ivory)] px-2.5 py-1 text-[0.65rem] text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]">
                {s}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">How many</span>
              <input type="number" min={1} max={15} value={count} onChange={(e) => setCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Skill</span>
              <select value={skillTag} onChange={(e) => setSkillTag(e.target.value as typeof skillTag)}
                className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
                <option value="grammar">Grammar</option>
                <option value="vocab">Vocabulary</option>
                <option value="reading">Reading</option>
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">Level</span>
              <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}
                className="mt-1.5 w-full rounded-sm border-0 bg-[var(--color-ivory)] px-3 py-2 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]">
                <option value="mixed">Mixed (A2–B2)</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={busy}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs text-[var(--color-ink-soft)] transition hover:text-[var(--color-rlc-800)] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={generate} disabled={busy || !topic.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

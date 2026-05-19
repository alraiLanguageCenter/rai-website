'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, FileQuestion, Library, Users, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherShell } from '@/components/portal/TeacherShell';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Class = { id: string; title: string; description: string | null; level: string | null; kind: string; status: string; capacity: number | null };
type Student = { id: string; display_name: string | null; email: string | null };
type Material = { id: string; title: string; url: string; kind: string; visibility: string; created_at: string };
type Exam = { id: string; title: string; status: string; due_at: string | null; total_points: number | null };

export default function TeacherClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TeacherShell><Body classId={id} /></TeacherShell>;
}

function Body({ classId }: { classId: string }) {
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tab, setTab] = useState<'students' | 'materials' | 'exams'>('students');

  async function load() {
    const sb = getSupabaseBrowser();
    const { data: c } = await sb.from('classes').select('*').eq('id', classId).maybeSingle();
    setCls(c as Class | null);

    const { data: enr } = await sb.from('enrollments').select('student_id').eq('class_id', classId);
    const ids = (enr ?? []).map((e: { student_id: string }) => e.student_id);
    if (ids.length) {
      const { data: ss } = await sb.from('profiles').select('id,display_name,email').in('id', ids);
      setStudents((ss ?? []) as Student[]);
    } else { setStudents([]); }

    const { data: m } = await sb.from('lesson_materials').select('*').eq('class_id', classId).order('sort_order');
    setMaterials((m ?? []) as Material[]);

    const { data: e } = await sb.from('exams').select('id,title,status,due_at,total_points').eq('class_id', classId).order('created_at', { ascending: false });
    setExams((e ?? []) as Exam[]);
  }
  useEffect(() => { load(); }, [classId]);

  async function enrollByEmail() {
    const email = prompt('Student email to enrol?'); if (!email) return;
    const sb = getSupabaseBrowser();
    const { data: p } = await sb.from('profiles').select('id,role').eq('email', email).maybeSingle();
    if (!p) { toast.error('No profile with that email. Ask them to log in once first.'); return; }
    if (p.role !== 'student') { toast.error('That profile is not a student.'); return; }
    const { error } = await sb.from('enrollments').insert({ class_id: classId, student_id: p.id });
    if (error) { toast.error('Enrol failed', { description: error.message }); return; }
    toast.success('Enrolled');
    load();
  }

  async function unenroll(studentId: string) {
    if (!confirm('Remove this student?')) return;
    const sb = getSupabaseBrowser();
    await sb.from('enrollments').delete().eq('class_id', classId).eq('student_id', studentId);
    load();
  }

  async function addMaterial() {
    const title = prompt('Material title?'); if (!title) return;
    const url = prompt('URL (paste a public link or upload to Storage and paste URL)?'); if (!url) return;
    const sb = getSupabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    const { error } = await sb.from('lesson_materials').insert({
      class_id: classId, teacher_id: u.user?.id, title, url, kind: url.endsWith('.pdf') ? 'pdf' : 'link', visibility: 'class',
    });
    if (error) { toast.error('Create failed', { description: error.message }); return; }
    load();
  }

  async function removeMaterial(id: string) {
    if (!confirm('Delete material?')) return;
    const sb = getSupabaseBrowser();
    await sb.from('lesson_materials').delete().eq('id', id);
    load();
  }

  if (!cls) return <div className="grid h-32 place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" /></div>;

  return (
    <div>
      <Link href="/teacher/classes" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to classes
      </Link>
      <h1 className="mt-4 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{cls.title}</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{cls.description ?? '—'}</p>

      <div className="mt-6 inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
        {(['students', 'materials', 'exams'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${tab === t ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)]'}`}>
            {t === 'students' && <Users className="h-3.5 w-3.5" />}
            {t === 'materials' && <Library className="h-3.5 w-3.5" />}
            {t === 'exams' && <FileQuestion className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-rlc-900)]">Enrolled students ({students.length})</h2>
            <button onClick={enrollByEmail}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
              <Plus className="h-3.5 w-3.5" /> Enrol by email
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-ivory)] text-left text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3 w-12"></th></tr>
              </thead>
              <tbody className="bg-[var(--color-cream)]">
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3 font-medium">{s.display_name ?? '—'}</td>
                    <td className="px-4 py-3" dir="ltr">{s.email ?? '—'}</td>
                    <td className="px-4 py-3"><button onClick={() => unenroll(s.id)} className="text-[var(--color-rose)] hover:underline"><Trash2 className="h-3.5 w-3.5" /></button></td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No students yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'materials' && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-rlc-900)]">Materials ({materials.length})</h2>
            <button onClick={addMaterial}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
              <Upload className="h-3.5 w-3.5" /> Add material
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)]">
                <Library className="h-4 w-4 text-[var(--color-gold)]" />
                <span className="flex-1">{m.title}</span>
                <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]">{m.kind}</span>
                <a href={m.url} target="_blank" rel="noreferrer noopener" className="text-[var(--color-rlc-800)]"><ExternalLink className="h-4 w-4" /></a>
                <button onClick={() => removeMaterial(m.id)} className="text-[var(--color-rose)]"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {materials.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-6 text-center text-[var(--color-ink-soft)]">No materials yet.</div>}
          </div>
        </div>
      )}

      {tab === 'exams' && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-rlc-900)]">Exams ({exams.length})</h2>
            <Link href={`/teacher/exams/new?classId=${classId}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]">
              <Plus className="h-3.5 w-3.5" /> Build MCQ exam
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {exams.map((e) => (
              <Link key={e.id} href={`/teacher/exams/${e.id}`}
                className="flex items-center gap-3 rounded-sm bg-[var(--color-cream)] px-4 py-3 ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]">
                <FileQuestion className="h-4 w-4 text-[var(--color-gold)]" />
                <span className="flex-1">{e.title}</span>
                <span className="rounded-full bg-[var(--color-ivory)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]">{e.status}</span>
              </Link>
            ))}
            {exams.length === 0 && <div className="rounded-sm bg-[var(--color-ivory)] p-6 text-center text-[var(--color-ink-soft)]">No exams yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

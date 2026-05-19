'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, MapPin, Users, X, Send, Loader2, GraduationCap, Mail, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Entry = {
  id: string;
  kind: 'course' | 'exam';
  title_ar: string; title_en: string;
  starts_at: string;
  ends_at: string | null;
  room: string | null;
  capacity: number | null;
  seats_taken: number;
  registration_url: string | null;
  status: 'open' | 'closed' | 'full';
};

export function Schedule() {
  const t = useTranslations('schedule');
  const locale = useLocale() as 'ar' | 'en';
  const [tab, setTab] = useState<'course' | 'exam'>('course');
  const [items, setItems] = useState<Entry[] | null>(null);
  const [registerEntry, setRegisterEntry] = useState<Entry | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error } = await sb
          .from('schedule_entries')
          .select('id,kind,title_ar,title_en,starts_at,ends_at,room,capacity,seats_taken,registration_url,status')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(50);
        if (!alive) return;
        if (error) { setItems([]); return; }
        setItems((data ?? []) as Entry[]);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = (items ?? []).filter((e) => e.kind === tab);
  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Section id="schedule" tone="cream">
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <Calendar className="h-3.5 w-3.5 text-[var(--color-gold)]" />{t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={0.2}>
        <div className="mt-10 inline-flex rounded-full bg-[var(--color-ivory)] p-1 ring-1 ring-[var(--color-line)]">
          {(['course', 'exam'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition ${
                tab === k ? 'text-[var(--color-cream)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-rlc-800)]'
              }`}>
              {tab === k && (
                <motion.span layoutId="scheduleTabBg" className="absolute inset-0 rounded-full bg-[var(--color-rlc-800)]" transition={{ type: 'spring', stiffness: 260, damping: 30 }} />
              )}
              <span className="relative">{t(`tabs.${k === 'course' ? 'courses' : 'exams'}`)}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-4">
        {items === null ? (
          <div className="grid h-40 place-items-center rounded-sm bg-[var(--color-ivory)]/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Reveal>
            <div className="rounded-sm bg-[var(--color-ivory)] p-10 text-center text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
              {t('empty')}
            </div>
          </Reveal>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((e, i) => {
              const seatsLeft = e.capacity != null ? Math.max(0, e.capacity - e.seats_taken) : null;
              const status = e.status === 'full' || (seatsLeft != null && seatsLeft === 0) ? 'full' : e.status;
              return (
                <motion.div key={e.id}
                  layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  className="card-lift group grid items-center gap-4 rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] md:grid-cols-[auto_1fr_auto] md:gap-8 md:p-6">
                  <div className="flex flex-col items-center justify-center rounded-sm bg-[var(--color-ivory)] px-5 py-3 text-center md:min-w-[110px]">
                    <div className="font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">
                      {dateFmt.format(new Date(e.starts_at))}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                      <Clock className="me-1 inline-block h-3 w-3" />
                      {timeFmt.format(new Date(e.starts_at))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                      {t(`kind.${e.kind}`)}
                    </div>
                    <h3 className="mt-1 font-[var(--font-display)] text-xl text-[var(--color-rlc-900)]">
                      {locale === 'ar' ? e.title_ar : e.title_en}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--color-ink-soft)]">
                      {e.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.room}</span>}
                      {seatsLeft != null && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t('fields.seats')}: {seatsLeft}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={status} t={t} />
                    {status === 'open' && (
                      <Button
                        size="md"
                        variant="gold"
                        onClick={() => setRegisterEntry(e)}
                      >
                        {t('register')}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {registerEntry && (
          <RegisterModal
            entry={registerEntry}
            locale={locale}
            onClose={() => setRegisterEntry(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}

/* -------------------- Register modal -------------------- */
/**
 * Animated registration pop-up triggered by the "Register" button on a
 * schedule entry. Captures the visitor's name + email + phone (+ optional
 * notes) and posts to /api/contact, which already routes a notification to
 * the admin inbox and persists the lead in Supabase. We pre-fill the
 * "course of interest" select with this entry so the team knows exactly
 * which slot they're after.
 */
function RegisterModal({
  entry, locale, onClose,
}: { entry: Entry; locale: 'ar' | 'en'; onClose: () => void }) {
  const isAr = locale === 'ar';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !submitting) onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, submitting]);

  const title = isAr ? entry.title_ar : entry.title_en;
  const dateFmt = new Intl.DateTimeFormat(isAr ? 'ar-SY' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(isAr ? 'ar-SY' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/.+@.+\..+/.test(email) || phone.trim().length < 5) {
      toast.error(isAr ? 'يرجى تعبئة الاسم والبريد ورقم الهاتف بشكل صحيح.' : 'Please fill name, email, and phone correctly.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale,
          website: '',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          course: entry.kind === 'exam' ? 'exams' : 'adults',
          message:
            `[Schedule registration]\n` +
            `Entry: ${title} (${entry.kind})\n` +
            `Starts at: ${new Date(entry.starts_at).toISOString()}\n` +
            (entry.room ? `Room: ${entry.room}\n` : '') +
            `\nNotes from candidate:\n${notes || '(none)'}`,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(isAr ? 'تعذّر إرسال طلبك. حاول مرة أخرى.' : (j.error || 'Could not submit. Try again.'));
        return;
      }
      setDone(true);
    } catch {
      toast.error(isAr ? 'تعذّر الاتصال بالخادم.' : "Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => !submitting && onClose()}
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/75 px-4 py-6 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--color-cream)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-[var(--color-line)]"
      >
        <button onClick={onClose} disabled={submitting} aria-label="Close"
          className="absolute end-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]">
          <X className="h-4 w-4" />
        </button>

        {/* Header band */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-rlc-900)] via-[var(--color-rlc-800)] to-[var(--color-rlc-900)] px-6 py-5 text-[var(--color-cream)]">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(201,162,74,0.22) 50%, transparent 65%)' }}
            initial={{ x: '-110%' }} animate={{ x: '110%' }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
          />
          <div className="relative">
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              {isAr ? 'تسجيل في' : 'Register for'} · {entry.kind === 'exam' ? (isAr ? 'امتحان' : 'Exam') : (isAr ? 'دورة' : 'Course')}
            </div>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[var(--color-cream)]">{title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-cream)]/85">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3 text-[var(--color-gold)]" /> {dateFmt.format(new Date(entry.starts_at))}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-[var(--color-gold)]" /> {timeFmt.format(new Date(entry.starts_at))}</span>
              {entry.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-[var(--color-gold)]" /> {entry.room}</span>}
            </div>
          </div>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 py-8 text-center"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">
              {isAr ? 'تمّ التسجيل! 🌿' : 'You are registered! 🌿'}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              {isAr
                ? 'وصلنا طلبك. سيتواصل معك فريق الراعي خلال يوم عمل واحد عبر البريد والواتساب لتأكيد المقعد.'
                : 'Your registration arrived. Our team will reach out within one business day by email + WhatsApp to confirm your seat.'}
            </p>
            <button
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-5 py-2.5 text-sm font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)]"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 px-6 py-6">
            <Field icon={User} label={isAr ? 'الاسم الكامل' : 'Full name'} required>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'اسمك بالكامل' : 'Your full name'}
                required
                className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={Mail} label={isAr ? 'البريد الإلكتروني' : 'Email'} required>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" dir="ltr"
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                />
              </Field>
              <Field icon={Phone} label={isAr ? 'رقم الواتساب' : 'WhatsApp number'} required>
                <input
                  type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+963 ..." dir="ltr"
                  className="w-full rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
                />
              </Field>
            </div>
            <Field label={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder={isAr ? 'أي تفاصيل تود مشاركتها...' : 'Any details you want to share...'}
                className="w-full resize-none rounded-sm border-0 bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rlc-800)]"
              />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-rlc-900)] shadow-[0_12px_28px_-12px_rgba(201,162,74,0.6)] transition hover:bg-[var(--color-gold-bright)] hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {isAr ? 'جارٍ الإرسال...' : 'Submitting...'}</>
                : <>{isAr ? 'سجّلني' : 'Register me'} <Send className="h-4 w-4 rtl:rotate-180" /></>
              }
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, icon: Icon, required, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        {Icon && <Icon className="h-3 w-3 text-[var(--color-gold)]" />}
        {label}{required && <span className="text-[var(--color-rose)]">*</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function StatusPill({ status, t }: { status: 'open' | 'closed' | 'full'; t: ReturnType<typeof useTranslations<'schedule'>> }) {
  const map = {
    open:   'bg-[var(--color-rlc-100)] text-[var(--color-rlc-800)]',
    closed: 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)]',
    full:   'bg-[var(--color-gold-soft)] text-[var(--color-rlc-900)]',
  } as const;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] ${map[status]}`}>{t(`status.${status}`)}</span>;
}

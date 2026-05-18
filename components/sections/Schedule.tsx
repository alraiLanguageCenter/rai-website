'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
                    {e.registration_url && status === 'open'
                      ? <Button href={e.registration_url} size="md" variant="gold">{t('register')}</Button>
                      : status === 'open'
                        ? <Button href="#book" size="md" variant="gold">{t('register')}</Button>
                        : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </Section>
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

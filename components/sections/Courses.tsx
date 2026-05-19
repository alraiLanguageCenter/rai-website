'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Briefcase,
  UserRound,
  Laptop2,
  X,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { StaggerGroup, staggerItem, Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

type Accent = 'green' | 'gold' | 'deep';

const META: Record<string, { Icon: React.ComponentType<{ className?: string }>; accent: Accent }> = {
  kids:     { Icon: BookOpen,       accent: 'gold' },
  adults:   { Icon: MessageCircle,  accent: 'green' },
  exams:    { Icon: GraduationCap,  accent: 'deep' },
  business: { Icon: Briefcase,      accent: 'green' },
  private:  { Icon: UserRound,      accent: 'gold' },
  online:   { Icon: Laptop2,        accent: 'deep' },
};

type CourseItem = { id: string; title: string; tag: string; badge?: string; summary: string; details: string; cta: string };

export function Courses() {
  const t = useTranslations('courses');
  const items = t.raw('items') as CourseItem[];
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = items.find((i) => i.id === openId) ?? null;
  const reduced = useReducedMotion();

  return (
    <Section id="courses" tone="ivory" className="overflow-hidden">
      {/* Drifting ambient blobs */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -end-20 -top-10 h-72 w-72 rounded-full bg-[var(--color-gold)]/10 blur-3xl"
            animate={{ y: [0, 14, 0], x: [0, -10, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -start-24 bottom-0 h-80 w-80 rounded-full bg-[var(--color-rlc-700)]/10 blur-3xl"
            animate={{ y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="mt-5 max-w-2xl body-lg text-[var(--color-ink-soft)]">{t('lede')}</p>
      </Reveal>

      <StaggerGroup className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
        {items.map((item) => {
          const meta = META[item.id] ?? { Icon: BookOpen, accent: 'green' as const };
          return (
            <CourseCard key={item.id} item={item} Icon={meta.Icon} accent={meta.accent} onOpen={() => setOpenId(item.id)} />
          );
        })}
      </StaggerGroup>

      <AnimatePresence>
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-ink)]/60 p-6 backdrop-blur-sm"
            onClick={() => setOpenId(null)} role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl rounded-sm bg-[var(--color-cream)] p-8 lg:p-12"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setOpenId(null)} aria-label="Close"
                className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-line)]/40">
                <X className="h-4 w-4" />
              </button>
              {opened.badge && <span className="inline-block rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-rlc-800)]">{opened.badge}</span>}
              <div className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{opened.tag}</div>
              <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{opened.title}</h3>
              <p className="mt-6 body-lg text-[var(--color-ink-soft)]">{opened.details}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#book" size="lg" magnetic onClick={() => setOpenId(null)}>{opened.cta}</Button>
                <Button href="#assess" size="lg" variant="secondary" onClick={() => setOpenId(null)}>Free placement</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

/* --------------------- Card --------------------- */

function CourseCard({
  item, Icon, accent, onOpen,
}: {
  item: CourseItem;
  Icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();

  // Accent → CSS variables for the card
  const accentVars: React.CSSProperties =
    accent === 'gold'
      ? { ['--accent' as never]: '#C9A24A', ['--accent-soft' as never]: 'rgba(201,162,74,0.14)' }
      : accent === 'deep'
        ? { ['--accent' as never]: '#083922', ['--accent-soft' as never]: 'rgba(8,57,34,0.12)' }
        : { ['--accent' as never]: '#1A6F45', ['--accent-soft' as never]: 'rgba(26,111,69,0.12)' };

  return (
    <motion.button
      variants={staggerItem}
      onClick={onOpen}
      whileHover={reduced ? undefined : { y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={accentVars}
      className="group relative flex h-full flex-col overflow-hidden rounded-md bg-[var(--color-cream)] p-7 text-start ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(8,57,34,0.35)]"
    >
      <span aria-hidden
        className="absolute inset-0 origin-top-left scale-x-0 bg-gradient-to-br from-[var(--accent-soft)] via-transparent to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100" />
      <span aria-hidden
        className="absolute inset-x-0 bottom-0 h-px w-0 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />

      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute end-5 top-5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
          style={{ opacity: 0.55 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {item.badge && (
        <div className="relative inline-flex">
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
          >
            {item.badge}
          </span>
        </div>
      )}

      <div className="relative mt-6">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full text-[var(--accent)] transition-transform duration-500 ease-out group-hover:rotate-[12deg]"
             style={{ backgroundColor: 'var(--accent-soft)' }}>
          <Icon className="h-6 w-6" />
          {!reduced && (
            <motion.span
              aria-hidden
              className="absolute -inset-1 rounded-full border"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <div className="mt-7 text-[0.7rem] uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>{item.tag}</div>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">{item.title}</h3>
        <p className="mt-3 text-[var(--color-ink-soft)]">{item.summary}</p>

        <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-rlc-800)] transition group-hover:text-[color:var(--accent)]">
          {item.cta}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 rtl:rotate-[-90deg]" />
        </div>
      </div>
    </motion.button>
  );
}

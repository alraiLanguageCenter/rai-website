'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BookOpen, MessageCircle, GraduationCap, Briefcase, X } from 'lucide-react';
import { Reveal, StaggerGroup, staggerItem } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

const iconFor: Record<string, React.ComponentType<{ className?: string }>> = {
  kids: BookOpen,
  adults: MessageCircle,
  exams: GraduationCap,
  business: Briefcase,
};

type CourseItem = { id: string; title: string; tag: string; summary: string; details: string; cta: string };

export function Courses() {
  const t = useTranslations('courses');
  const items = t.raw('items') as CourseItem[];
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = items.find((i) => i.id === openId) ?? null;

  return (
    <Section id="courses" tone="ivory">
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>

      <StaggerGroup className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = iconFor[item.id] ?? BookOpen;
          return (
            <motion.button key={item.id} variants={staggerItem} onClick={() => setOpenId(item.id)}
              whileHover={{ y: -6 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-[var(--color-cream)] p-7 text-start ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(8,57,34,0.35)]">
              <span aria-hidden className="absolute inset-0 origin-top-left scale-x-0 bg-gradient-to-br from-[var(--color-gold)]/15 via-transparent to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100" />
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-px w-0 bg-[var(--color-gold)] transition-all duration-500 group-hover:w-full" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-rlc-800)]/8 text-[var(--color-rlc-800)] transition-transform duration-500 group-hover:rotate-[12deg] group-hover:bg-[var(--color-gold)]/15 group-hover:text-[var(--color-gold)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-8 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{item.tag}</div>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-rlc-900)]">{item.title}</h3>
                <p className="mt-4 text-[var(--color-ink-soft)]">{item.summary}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-rlc-800)]">
                  {item.cta}
                  <span className="rtl:rotate-180" aria-hidden>→</span>
                </div>
              </div>
            </motion.button>
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
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">{opened.tag}</div>
              <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">{opened.title}</h3>
              <p className="mt-6 body-lg text-[var(--color-ink-soft)]">{opened.details}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#book" size="lg" magnetic onClick={() => setOpenId(null)}>{opened.cta}</Button>
                <Button href="#assess" size="lg" variant="secondary" onClick={() => setOpenId(null)}>
                  {opened.id === 'exams' ? 'Mock test' : 'Free placement'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

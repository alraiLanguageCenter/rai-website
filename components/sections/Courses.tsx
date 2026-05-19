'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocale } from 'next-intl';
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

      {/* MORE → Open catalog */}
      <div className="mt-12 flex justify-center">
        <CatalogTrigger />
      </div>

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

/* ----------------------- Full catalog (More button) ----------------------- */

type Language = {
  code: string;
  flag: string;
  name: { en: string; ar: string };
  courses: { en: string; ar: string }[];
};

const LANGUAGES: Language[] = [
  {
    code: 'en', flag: '🇬🇧',
    name: { en: 'English', ar: 'الإنجليزية' },
    courses: [
      { en: 'General English (A1–C2)',  ar: 'إنجليزية عامة (A1–C2)' },
      { en: 'Kids & Teens (ages 7–17)',  ar: 'الأطفال واليافعون (٧–١٧)' },
      { en: 'IELTS Preparation',         ar: 'تحضير IELTS' },
      { en: 'TOEFL Preparation',         ar: 'تحضير TOEFL' },
      { en: 'Cambridge FCE / CAE',       ar: 'Cambridge FCE / CAE' },
      { en: 'Business English',          ar: 'إنجليزية الأعمال' },
      { en: 'Medical English',           ar: 'الإنجليزية الطبية' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
      { en: 'Private 1-on-1',            ar: 'دروس خصوصية' },
      { en: 'Online Live Classes',       ar: 'صفوف أونلاين' },
    ],
  },
  {
    code: 'fr', flag: '🇫🇷',
    name: { en: 'French', ar: 'الفرنسية' },
    courses: [
      { en: 'General French (A1–B2)',    ar: 'فرنسية عامة (A1–B2)' },
      { en: 'DELF / DALF Preparation',   ar: 'تحضير DELF / DALF' },
      { en: 'Business French',           ar: 'الفرنسية للأعمال' },
      { en: 'Kids & Teens French',       ar: 'الفرنسية للأطفال' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
    ],
  },
  {
    code: 'de', flag: '🇩🇪',
    name: { en: 'German', ar: 'الألمانية' },
    courses: [
      { en: 'General German (A1–B2)',    ar: 'ألمانية عامة (A1–B2)' },
      { en: 'Goethe-Zertifikat Prep',    ar: 'تحضير شهادة جوته' },
      { en: 'TestDaF Preparation',       ar: 'تحضير TestDaF' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
    ],
  },
  {
    code: 'ru', flag: '🇷🇺',
    name: { en: 'Russian', ar: 'الروسية' },
    courses: [
      { en: 'General Russian (A1–B2)',   ar: 'روسية عامة (A1–B2)' },
      { en: 'TORFL Preparation',         ar: 'تحضير TORFL' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
    ],
  },
  {
    code: 'es', flag: '🇪🇸',
    name: { en: 'Spanish', ar: 'الإسبانية' },
    courses: [
      { en: 'General Spanish (A1–B2)',   ar: 'إسبانية عامة (A1–B2)' },
      { en: 'DELE Preparation',          ar: 'تحضير DELE' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
    ],
  },
  {
    code: 'tr', flag: '🇹🇷',
    name: { en: 'Turkish', ar: 'التركية' },
    courses: [
      { en: 'General Turkish (A1–B2)',   ar: 'تركية عامة (A1–B2)' },
      { en: 'TÖMER Preparation',         ar: 'تحضير TÖMER' },
      { en: 'Conversation Club',         ar: 'نادي المحادثة' },
    ],
  },
  {
    code: 'ar', flag: '🇸🇾',
    name: { en: 'Arabic (for foreigners)', ar: 'العربية لغير الناطقين بها' },
    courses: [
      { en: 'Modern Standard Arabic',     ar: 'العربية الفصحى الحديثة' },
      { en: 'Levantine Colloquial',       ar: 'اللهجة الشامية' },
      { en: 'Quranic Arabic',             ar: 'العربية القرآنية' },
    ],
  },
];

function CatalogTrigger() {
  const locale = useLocale() as 'ar' | 'en';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-7 py-3.5 text-sm font-semibold text-[var(--color-cream)] shadow-[0_14px_30px_-14px_rgba(8,57,34,0.55)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5"
      >
        <BookOpen className="h-4 w-4" />
        {locale === 'ar' ? 'تصفّح كل اللغات والدورات' : 'Browse all languages & courses'}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 rtl:rotate-[-90deg]" />
      </button>

      <AnimatePresence>
        {open && <CatalogModal onClose={() => setOpen(false)} locale={locale} />}
      </AnimatePresence>
    </>
  );
}

function CatalogModal({ onClose, locale }: { onClose: () => void; locale: 'ar' | 'en' }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = LANGUAGES.length;
  const lang = LANGUAGES[pageIdx];

  function go(d: 1 | -1) {
    setDirection(d);
    setPageIdx((p) => (p + d + total) % total);
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(locale === 'ar' ? -1 : 1);
      else if (e.key === 'ArrowLeft') go(locale === 'ar' ? 1 : -1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locale, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-ink)]/70 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-md bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] shadow-[0_30px_80px_-20px_rgba(8,57,34,0.5)]"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute end-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-line)]/40"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header: language tabs (chip row) */}
        <div className="border-b border-[var(--color-line)] bg-[var(--color-ivory)] px-6 py-4">
          <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
            {locale === 'ar' ? 'كتاب الدورات' : 'Course catalogue'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANGUAGES.map((l, i) => (
              <button
                key={l.code}
                onClick={() => { setDirection(i > pageIdx ? 1 : -1); setPageIdx(i); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  i === pageIdx
                    ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
                    : 'bg-[var(--color-cream)] text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]'
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                {l.name[locale]}
              </button>
            ))}
          </div>
        </div>

        {/* Page area with flip animation */}
        <div className="relative min-h-[420px] overflow-hidden bg-[var(--color-cream)]" style={{ perspective: 1600 }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={lang.code}
              custom={direction}
              initial={{ rotateY: direction > 0 ? 75 : -75, opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ rotateY: 0, opacity: 1, x: 0 }}
              exit={{ rotateY: direction > 0 ? -75 : 75, opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: 'preserve-3d', transformOrigin: locale === 'ar' ? 'right center' : 'left center' }}
              className="px-6 py-10 sm:px-12 sm:py-12"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-rlc-100)] text-3xl">{lang.flag}</div>
                <div>
                  <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                    {locale === 'ar' ? `الصفحة ${pageIdx + 1} من ${total}` : `Page ${pageIdx + 1} of ${total}`}
                  </div>
                  <h3 className="mt-1 font-[var(--font-display)] text-4xl text-[var(--color-rlc-900)] sm:text-5xl">{lang.name[locale]}</h3>
                </div>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {lang.courses.map((c, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex items-start gap-3 rounded-sm bg-[var(--color-ivory)] px-4 py-3 text-sm ring-1 ring-[var(--color-line)]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                    <span className="text-[var(--color-ink)]">{c[locale]}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex justify-center">
                <Button href="#book" size="md" variant="gold" onClick={onClose}>
                  {locale === 'ar' ? 'احجز جلسة تعارف' : 'Book a discovery session'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: prev/next */}
        <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-ivory)] px-6 py-3">
          <button
            onClick={() => go(locale === 'ar' ? 1 : -1)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-4 py-2 text-xs font-medium text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]"
          >
            {locale === 'ar' ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {locale === 'ar' ? 'الصفحة السابقة' : 'Previous'}
          </button>
          <div className="flex gap-1">
            {LANGUAGES.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === pageIdx ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-ink)]/15'}`} />
            ))}
          </div>
          <button
            onClick={() => go(locale === 'ar' ? -1 : 1)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-800)] px-4 py-2 text-xs font-medium text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)]"
          >
            {locale === 'ar' ? 'الصفحة التالية' : 'Next page'}
            {locale === 'ar' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


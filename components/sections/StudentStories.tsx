'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Trophy, Quote, X, ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

/* -------------------- Source data -------------------- */

type Win = {
  name: string;
  role: string;
  initials: string;
  quote: string;
  meta?: string;
  accent: 'gold' | 'green';
};

const WINS: Win[] = [
  { name: 'Lara H.',    role: 'Advanced English', initials: 'LH', quote: 'I reached my goal — thank you RLC!',                  meta: 'Certificate of Achievement', accent: 'gold' },
  { name: 'Reem K.',    role: 'IELTS Prep',       initials: 'RK', quote: 'Overall band score 7.5 on first attempt.',            meta: 'IELTS · 7.5',                accent: 'green' },
  { name: 'Salma A.',   role: 'Business English', initials: 'SA', quote: 'From learning English to leading with confidence.',   meta: 'Marketing Manager',          accent: 'gold' },
  { name: 'Youssef K.', role: 'Kids Program',     initials: 'YK', quote: 'I speak English with confidence now!',                meta: '⭐ Star of the week',         accent: 'green' },
  { name: 'Nadine H.',  role: 'Business English', initials: 'NH', quote: 'Better English, better opportunities, better me.',    meta: 'Senior Project Manager',     accent: 'gold' },
  { name: 'Fatima M.',  role: 'Advanced English', initials: 'FM', quote: 'RLC helped me gain the confidence to speak in any situation.', meta: 'Advanced English', accent: 'green' },
  { name: 'Omar B.',    role: 'TOEFL Prep',       initials: 'OB', quote: 'A different language is a different vision of life.', meta: 'Scored 105/120',             accent: 'gold' },
];

type Testimonial = { name: string; course: string; quote: string };

/* -------------------- Section -------------------- */

export function StudentStories() {
  const t = useTranslations('stories');
  const tw = useTranslations('wins');
  const tt = useTranslations('testimonials');
  const locale = useLocale();
  const reduced = useReducedMotion();

  // Translations might not exist yet — fall back to literals so the section
  // never blanks out while migrations land.
  const sectionTitle = safeT(() => t('title'), locale === 'ar' ? 'أصوات وانتصارات راي' : 'Voices & wins of Rai');
  const sectionEyebrow = safeT(() => t('eyebrow'), locale === 'ar' ? 'قصص الطلاب' : 'Student stories');
  const sectionLede = safeT(
    () => t('lede'),
    locale === 'ar'
      ? 'ثلاثون عاماً من القصص. هؤلاء طلابنا — كلماتهم، نتائجهم، رحلتهم.'
      : 'Thirty years of stories. These are our students — in their own words, with their results, on their journey.',
  );
  const triggerLabel = safeT(
    () => t('open'),
    locale === 'ar' ? 'افتح جدار الأصوات' : 'Open the wall of voices',
  );
  const winsEyebrow = safeT(() => tw('eyebrow'), 'Wall of wins');
  const winsLede = safeT(() => tw('lede'), 'Real students. Real results.');
  const testimonialsEyebrow = safeT(() => tt('eyebrow'), 'In their words');
  const testimonials = (safeT(() => tt.raw('items') as Testimonial[], []) as Testimonial[]) ?? [];

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'wins' | 'voices'>('wins');

  // Interleave wins + testimonials into the preview marquee
  const mixed = useMemo(() => {
    const out: ({ kind: 'win'; data: Win } | { kind: 'voice'; data: Testimonial })[] = [];
    const max = Math.max(WINS.length, testimonials.length);
    for (let i = 0; i < max; i++) {
      if (WINS[i]) out.push({ kind: 'win', data: WINS[i] });
      if (testimonials[i]) out.push({ kind: 'voice', data: testimonials[i] });
    }
    return out;
  }, [testimonials]);

  // Auto-rotating preview carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => clearInterval(id);
  }, [emblaApi]);

  return (
    <Section id="stories" tone="rlc-dark" bleed className="relative isolate overflow-hidden py-24 lg:py-32">
      {/* Backdrop */}
      <StoriesBackdrop reduced={!!reduced} />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3 !text-[var(--color-gold)]">
            <Trophy className="h-3.5 w-3.5" />
            <Quote className="h-3.5 w-3.5" />
            {sectionEyebrow}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display-lg mt-6 max-w-3xl !text-[var(--color-cream)]">{sectionTitle}</h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 max-w-xl body-lg text-[var(--color-cream)]/75">{sectionLede}</p>
        </Reveal>
      </div>

      {/* Preview marquee of mixed cards */}
      <div className="relative mt-12 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 px-6 lg:px-10">
          {mixed.concat(mixed).map((card, i) => (
            <div key={i} className="shrink-0 basis-[88%] sm:basis-[58%] lg:basis-[36%]">
              {card.kind === 'win'
                ? <WinCardPreview win={card.data} />
                : <VoiceCardPreview t={card.data} />}
            </div>
          ))}
        </div>
      </div>

      {/* The attractive trigger */}
      <div className="relative mx-auto mt-14 flex w-full max-w-7xl justify-center px-6">
        <BigTrigger
          label={triggerLabel}
          countWins={WINS.length}
          countVoices={testimonials.length}
          locale={locale}
          onClick={() => setOpen(true)}
        />
      </div>

      {/* Carousel arrows */}
      <div className="relative mx-auto mt-8 flex w-full max-w-7xl items-center justify-end gap-3 px-6 lg:px-10">
        <button onClick={() => emblaApi?.scrollPrev()} aria-label="Previous"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--color-cream)]/30 text-[var(--color-cream)] transition hover:bg-[var(--color-cream)]/10">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button onClick={() => emblaApi?.scrollNext()} aria-label="Next"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-[var(--color-cream)]/30 text-[var(--color-cream)] transition hover:bg-[var(--color-cream)]/10">
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <StoriesArchive
            onClose={() => setOpen(false)}
            wins={WINS}
            voices={testimonials}
            tab={tab}
            setTab={setTab}
            locale={locale}
            labels={{
              wins: winsEyebrow,
              voices: testimonialsEyebrow,
              winsLede,
            }}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}

/* -------------------- Helper: safe translation -------------------- */
/**
 * Wraps a next-intl translation lookup so the section degrades gracefully when
 * a key (or whole namespace) is missing. next-intl can return the dotted key
 * itself ("stories.title") when a translation is missing — we treat that as
 * "fall back to the English literal" so the UI never shows raw keys to users.
 */
function safeT<T>(fn: () => T, fallback: T): T {
  try {
    const v = fn();
    if (v == null) return fallback;
    if (typeof v === 'string') {
      if (v === '' || /^[a-zA-Z]+\.[a-zA-Z]+/.test(v)) return fallback;
    }
    return v;
  } catch {
    return fallback;
  }
}

/* -------------------- Backdrop -------------------- */

function StoriesBackdrop({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Gold mesh sweep */}
      {!reduced && (
        <motion.div
          className="absolute -inset-[20%]"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(201,162,74,0.18), transparent 22%, rgba(255,255,255,0.04) 40%, transparent 70%, rgba(201,162,74,0.16) 90%, transparent 100%)',
            filter: 'blur(60px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Floating quote marks */}
      {!reduced && (
        <>
          <motion.div
            className="absolute -start-6 top-10 select-none font-[var(--font-display)] text-[18rem] leading-none text-[var(--color-gold)]/10"
            animate={{ y: [0, -20, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          >
            “
          </motion.div>
          <motion.div
            className="absolute -end-12 bottom-2 select-none font-[var(--font-display)] text-[20rem] leading-none text-[var(--color-gold)]/10"
            animate={{ y: [0, 18, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          >
            ”
          </motion.div>
        </>
      )}

      {/* Particles */}
      {!reduced &&
        Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 41) % 100}%`,
              opacity: 0.55,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
            transition={{ duration: 4 + (i % 5), delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
    </div>
  );
}

/* -------------------- Preview cards -------------------- */

function WinCardPreview({ win }: { win: Win }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-sm bg-[var(--color-cream)] p-5 ring-1 ring-[var(--color-line)] sm:p-7">
      <div className={`absolute end-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full sm:h-28 sm:w-28 ${win.accent === 'gold' ? 'bg-[var(--color-gold)]/22' : 'bg-[var(--color-rlc-700)]/22'}`} />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-rlc-900)] font-[var(--font-display)] text-[var(--color-gold)] sm:h-12 sm:w-12">
          {win.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate font-[var(--font-display)] text-base text-[var(--color-rlc-900)] sm:text-lg">{win.name}</div>
          <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-soft)] sm:text-xs">{win.role}</div>
        </div>
        <Trophy className="ms-auto h-4 w-4 shrink-0 text-[var(--color-gold)]" />
      </div>
      <p className="relative mt-4 text-base leading-relaxed text-[var(--color-ink)] sm:mt-6 sm:text-lg">“{win.quote}”</p>
      {win.meta && (
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-rlc-100)] px-3 py-1 text-xs text-[var(--color-rlc-800)] sm:mt-6">
          {win.meta}
        </div>
      )}
    </article>
  );
}

function VoiceCardPreview({ t }: { t: Testimonial }) {
  const initials = t.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
  return (
    <article className="group relative h-full overflow-hidden rounded-sm bg-[var(--color-rlc-800)] p-5 text-[var(--color-cream)] ring-1 ring-[var(--color-cream)]/15 sm:p-7">
      <Quote className="h-6 w-6 text-[var(--color-gold)] sm:h-7 sm:w-7" />
      <p className="mt-4 text-base leading-relaxed text-[var(--color-cream)]/95 sm:mt-5 sm:text-lg">“{t.quote}”</p>
      <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-cream)]/15 pt-5 sm:mt-8 sm:gap-4 sm:pt-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] font-[var(--font-display)] text-[var(--color-rlc-900)] sm:h-12 sm:w-12">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate font-[var(--font-display)] text-base sm:text-lg">{t.name}</div>
          <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-cream)]/65 sm:text-xs">{t.course}</div>
        </div>
      </div>
    </article>
  );
}

/* -------------------- The attractive trigger -------------------- */

function BigTrigger({
  label,
  countWins,
  countVoices,
  locale,
  onClick,
}: {
  label: string;
  countWins: number;
  countVoices: number;
  locale: string;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 18 });
  const sy = useSpring(my, { stiffness: 220, damping: 18 });
  const rotateY = useTransform(sx, [-50, 50], [-6, 6]);
  const rotateX = useTransform(sy, [-50, 50], [4, -4]);

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) - r.width / 2) * 0.4);
    my.set(((e.clientY - r.top) - r.height / 2) * 0.4);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <motion.button
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: 'preserve-3d' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--color-cream)] px-5 py-5 text-start text-[var(--color-rlc-900)] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] ring-1 ring-[var(--color-cream)]/30 sm:max-w-none sm:px-12 sm:py-7"
    >
      {/* Pulsing rings */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -inset-px rounded-2xl border border-[var(--color-gold)]/40"
            animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.15, 0.55] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -inset-2 rounded-2xl border border-[var(--color-gold)]/30"
            animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
        </>
      )}

      {/* Sliding shimmer */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(201,162,74,0.35) 50%, transparent 65%)' }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)] sm:h-12 sm:w-12">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              {locale === 'ar' ? 'الجدار الكامل' : 'The full wall'}
            </div>
            <div className="mt-0.5 font-[var(--font-display)] text-lg leading-tight text-[var(--color-rlc-900)] sm:text-2xl">{label}</div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-rlc-100)] px-2.5 py-1 text-[0.7rem] font-medium text-[var(--color-rlc-800)] sm:px-3 sm:py-1.5 sm:text-xs">
            <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {countWins} {locale === 'ar' ? 'إنجاز' : 'wins'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/20 px-2.5 py-1 text-[0.7rem] font-medium text-[var(--color-rlc-800)] sm:px-3 sm:py-1.5 sm:text-xs">
            <Quote className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {countVoices} {locale === 'ar' ? 'شهادة' : 'voices'}
          </span>
          <motion.span
            className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-rlc-800)] px-3.5 py-2 text-xs font-semibold text-[var(--color-cream)] sm:ms-0 sm:px-4"
            whileHover={{ x: 4 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {locale === 'ar' ? 'افتح' : 'Open'} →
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}

/* -------------------- Archive modal -------------------- */

function StoriesArchive({
  onClose, wins, voices, tab, setTab, locale, labels,
}: {
  onClose: () => void;
  wins: Win[];
  voices: Testimonial[];
  tab: 'wins' | 'voices';
  setTab: (t: 'wins' | 'voices') => void;
  locale: string;
  labels: { wins: string; voices: string; winsLede: string };
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-ink)]/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-[var(--color-cream)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] sm:max-h-[88vh]"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ivory)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)] sm:text-[0.7rem]">
              {locale === 'ar' ? 'جدار راي' : "Rai's wall"}
            </div>
            <h3 className="mt-0.5 font-[var(--font-display)] text-lg text-[var(--color-rlc-900)] sm:text-2xl">
              {locale === 'ar' ? 'انتصارات وشهادات الطلاب' : 'Student wins & testimonials'}
            </h3>
          </div>
          <button
            onClick={onClose} aria-label="Close"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 sm:px-6">
          <TabBtn active={tab === 'wins'} onClick={() => setTab('wins')}>
            <Trophy className="h-3.5 w-3.5" /> {labels.wins} <span className="opacity-60">({wins.length})</span>
          </TabBtn>
          <TabBtn active={tab === 'voices'} onClick={() => setTab('voices')}>
            <Quote className="h-3.5 w-3.5" /> {labels.voices} <span className="opacity-60">({voices.length})</span>
          </TabBtn>
        </div>

        {/* Body */}
        <div className="grow overflow-y-auto bg-[var(--color-cream)] px-4 py-6 sm:px-8 sm:py-8">
          <AnimatePresence mode="wait">
            {tab === 'wins' ? (
              <motion.div
                key="wins"
                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {wins.map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <WinCardPreview win={w} />
                  </motion.div>
                ))}
              </motion.div>
            ) : voices.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-12 text-center text-[var(--color-ink-soft)]"
              >
                {locale === 'ar' ? 'لا توجد شهادات متاحة بعد.' : 'No testimonials yet.'}
              </motion.p>
            ) : (
              <motion.div
                key="voices"
                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {voices.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <VoiceCardPreview t={v} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]'
          : 'bg-[var(--color-ivory)] text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-rlc-100)]'
      }`}
    >
      {children}
    </button>
  );
}

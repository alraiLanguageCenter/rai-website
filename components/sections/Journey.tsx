'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, Compass, BookOpen, LineChart, Award } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

type Step = { n: string; title: string; body: string; back?: string };

// Five anchor points on a winding path (percent of 1000x1600 viewBox)
const ANCHORS = [
  { x: 18, y: 12 },
  { x: 82, y: 28 },
  { x: 16, y: 48 },
  { x: 80, y: 68 },
  { x: 50, y: 90 },
];

const ICONS = [Sparkles, Compass, BookOpen, LineChart, Award];

// Photos per step (0-indexed). 1, 2, 3 are the new RLC photos; 5 keeps Nouha portrait.
const PHOTOS: Record<number, string> = {
  0: '/brand/journey-1.png',
  1: '/brand/journey-2.png',
  2: '/brand/journey-3.png',
  4: '/brand/nouha-portrait.jpg',
};

const AMBIENT_WORDS = [
  'Hello', 'Speak', 'Listen', 'Read', 'Write',
  'Discover', 'Practice', 'Confidence', 'Imagine', 'Connect',
  'Grow', 'Dream', 'Express', 'Welcome', 'Together',
];

export function Journey() {
  const t = useTranslations('journey');
  const steps = t.raw('steps') as Step[];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const drawn = useTransform(scrollYProgress, [0.05, 0.85], [0, 1]);

  const path = buildWindingPath(ANCHORS);

  return (
    <section id="journey" ref={ref} className="relative isolate overflow-hidden bg-[var(--color-rlc-900)] py-24 lg:py-32 text-[var(--color-cream)]">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 gradient-mesh" />
      </div>
      <div className="grain" aria-hidden />

      {/* Ambient floating words — soft, sparse, golden */}
      {!reduced && <AmbientWords words={AMBIENT_WORDS} />}

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3 !text-[var(--color-gold)]">
            <Sparkles className="h-3.5 w-3.5" />{t('eyebrow')}
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display-lg mt-6 max-w-3xl !text-[var(--color-cream)]">{t('title')}</h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 max-w-2xl body-lg text-[var(--color-cream)]/80">{t('lede')}</p>
        </Reveal>

        <div className="relative mt-16 lg:mt-24">
          {/* SVG winding path */}
          <div className="pointer-events-none absolute inset-0">
            <svg viewBox="0 0 1000 1600" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#E0BC65" stopOpacity="1" />
                  <stop offset="100%" stopColor="#C9A24A" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <path d={path} stroke="rgba(233, 210, 156, 0.18)" strokeWidth="2"
                strokeDasharray="8 12" fill="none" />
              <motion.path
                d={path}
                stroke="url(#pathGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="14 14"
                fill="none"
                filter="url(#glow)"
                style={{ pathLength: reduced ? 1 : drawn }}
              />
            </svg>
          </div>

          {/* START tag */}
          <div className="pointer-events-none absolute start-[4%] top-[4%] -translate-y-1/2 select-none">
            <span className="font-[var(--font-display)] italic text-[var(--color-gold)] text-2xl lg:text-3xl">{t('start')}</span>
          </div>

          <div className="relative grid grid-cols-12 gap-y-16 lg:gap-y-28" style={{ minHeight: 'min(1300px, 140vh)' }}>
            {steps.map((s, i) => {
              const Icon = ICONS[i];
              const colSpan = 'col-span-12 md:col-span-7';
              const startCol = i % 2 === 0 ? 'md:col-start-1' : 'md:col-start-6';
              const photo = PHOTOS[i];
              return (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`${colSpan} ${startCol} relative z-10`}
                >
                  <div className={`relative grid gap-5 ${photo ? 'md:grid-cols-[220px_1fr]' : ''}`}>
                    {photo && (
                      <FlipCard
                        front={
                          <FramedPhoto src={photo} number={s.n} />
                        }
                        back={
                          <FlipBack title={s.title} back={s.back ?? s.body} />
                        }
                      />
                    )}
                    <div className="relative">
                      <div className="inline-flex items-center gap-3">
                        {/* Big numbered badge only when there's no photo (photo carries its own number stamp) */}
                        {!photo && (
                          <motion.div
                            initial={reduced ? false : { scale: 0, rotate: -45 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-rlc-900)] font-[var(--font-display)] text-xl shadow-[0_10px_30px_-10px_rgba(201,162,74,0.7)]"
                          >
                            {s.n}
                            <motion.span
                              aria-hidden
                              className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/40"
                              animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </motion.div>
                        )}
                        <Icon className="h-5 w-5 text-[var(--color-cream)]/60" />
                      </div>
                      <h3 className={`${photo ? 'mt-2' : 'mt-5'} font-[var(--font-display)] text-2xl text-[var(--color-cream)] lg:text-3xl`}>{s.title}</h3>
                      <p className="mt-3 max-w-md text-[var(--color-cream)]/75 leading-relaxed">{s.body}</p>
                      {photo && (
                        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-gold)]/80">{t('flipHint')}</p>
                      )}
                    </div>
                  </div>

                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute h-3 w-3 rounded-full bg-[var(--color-gold)] shadow-[0_0_0_4px_rgba(201,162,74,0.25)]"
                    style={{
                      left: i % 2 === 0 ? 'auto' : '-1.25rem',
                      right: i % 2 === 0 ? '-1.25rem' : 'auto',
                      top: '1.4rem',
                    }}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </motion.article>
              );
            })}
          </div>

          <Reveal>
            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full bg-[var(--color-gold)] px-6 py-3 text-[var(--color-rlc-900)] font-semibold shadow-[0_20px_40px_-20px_rgba(201,162,74,0.8)]">
                <Award className="h-4 w-4" />
                {t('finish')}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

/**
 * Flip card with 3D perspective. Front and back swap on hover (or tap on mobile via :focus-within).
 */
function FlipCard({ front, back }: { front: React.ReactNode; back: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className="relative aspect-square">{front}</div>;
  }

  return (
    <div className="group relative aspect-square" tabIndex={0} style={{ perspective: 1200 }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        animate={{ rotateY: 0 }}
        whileHover={{ rotateY: 180 }}
        whileFocus={{ rotateY: 180 }}
      >
        {/* Front */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never }}>
          {front}
        </div>
        {/* Back (rotated 180°) */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden' as never,
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Photo with the website's signature frame: animated gold corner brackets,
 * offset gold double-frame line, and a soft rim shimmer.
 */
function FramedPhoto({ src, number }: { src: string; number: string }) {
  return (
    <div className="relative h-full w-full">
      {/* Offset gold double-frame line, behind */}
      <div aria-hidden className="pointer-events-none absolute -inset-2.5">
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm border border-[var(--color-gold)]/55" />
      </div>

      {/* The framed photo */}
      <div className="relative h-full w-full overflow-hidden rounded-sm bg-[var(--color-rlc-900)] ring-2 ring-[var(--color-gold)]/45 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
        <Image src={src} alt="" fill sizes="220px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/55 via-transparent to-transparent" />

        {/* Step number stamp */}
        <div className="absolute end-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-gold)] font-[var(--font-display)] text-sm text-[var(--color-rlc-900)] shadow-[0_6px_18px_-6px_rgba(201,162,74,0.7)]">
          {number}
        </div>

        {/* Rim shimmer */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(120deg, transparent 35%, rgba(233, 210, 156, 0.32) 50%, transparent 65%)',
            mixBlendMode: 'overlay',
          }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        />

        {/* Corner brackets */}
        <Corners />
      </div>
    </div>
  );
}

function Corners() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const } },
  };
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100" preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full text-[var(--color-gold)]"
      initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
    >
      <motion.path d="M 1 14 L 1 1 L 14 1"   stroke="currentColor" strokeWidth="0.7" fill="none" variants={draw} />
      <motion.path d="M 86 1 L 99 1 L 99 14" stroke="currentColor" strokeWidth="0.7" fill="none" variants={draw} />
      <motion.path d="M 1 86 L 1 99 L 14 99" stroke="currentColor" strokeWidth="0.7" fill="none" variants={draw} />
      <motion.path d="M 86 99 L 99 99 L 99 86" stroke="currentColor" strokeWidth="0.7" fill="none" variants={draw} />
    </motion.svg>
  );
}

function FlipBack({ title, back }: { title: string; back: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm bg-gradient-to-br from-[var(--color-rlc-800)] to-[var(--color-rlc-900)] p-5 ring-2 ring-[var(--color-gold)]/55 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
      {/* Gold corner brackets on the back too — same family */}
      <Corners />
      <div className="flex h-full flex-col justify-between">
        <Sparkles className="h-5 w-5 text-[var(--color-gold)]" />
        <div>
          <div className="font-[var(--font-display)] italic text-[var(--color-gold)]">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-cream)]/90">{back}</p>
        </div>
        <div className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-cream)]/50">↩ flip back</div>
      </div>
    </div>
  );
}

/**
 * Ambient drifting English words sprinkled across the section,
 * behind the path. Subtle gold/cream tints, never competes with content.
 */
function AmbientWords({ words }: { words: string[] }) {
  const placements = words.map((_, i) => {
    const r1 = ((i * 2654435761) % 1000) / 1000;
    const r2 = ((i * 1597334677) % 1000) / 1000;
    const r3 = ((i * 374761393) % 1000) / 1000;
    const r4 = ((i * 911) % 1000) / 1000;
    return {
      top: `${4 + r1 * 92}%`,
      left: `${3 + r2 * 94}%`,
      delay: r3 * 8,
      duration: 9 + r4 * 7,
      depth: 0.25 + r1 * 0.65,
      fontSize: 0.7 + r2 * 1.2,
      rotate: r3 * 12 - 6,
      italic: r4 > 0.5,
      goldTint: r1 > 0.65,
    };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {words.map((w, i) => {
        const p = placements[i];
        return (
          <motion.span
            key={`${w}-${i}`}
            className={`absolute select-none font-[var(--font-display)] ${p.italic ? 'italic' : ''} ${p.goldTint ? 'text-[var(--color-gold)]/40' : 'text-[var(--color-cream)]/15'}`}
            style={{
              top: p.top,
              left: p.left,
              fontSize: `${p.fontSize}rem`,
              filter: `blur(${(1 - p.depth) * 1.6}px)`,
            }}
            initial={{ opacity: 0, y: 30, rotate: p.rotate }}
            animate={{
              opacity: [0, p.depth * 0.7, 0],
              y: [30, -35, -55],
              rotate: [p.rotate, p.rotate + 2, p.rotate - 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {w}
          </motion.span>
        );
      })}
    </div>
  );
}

function buildWindingPath(anchors: { x: number; y: number }[]): string {
  if (anchors.length === 0) return '';
  const pts = anchors.map((a) => ({ x: (a.x / 100) * 1000, y: (a.y / 100) * 1600 }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dy = curr.y - prev.y;
    const c1 = { x: prev.x, y: prev.y + dy * 0.55 };
    const c2 = { x: curr.x, y: curr.y - dy * 0.55 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, Compass, BookOpen, LineChart, Award } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

type Step = { n: string; title: string; body: string };

// Five anchor points on a winding path (percent of 1000x1600 viewBox)
// Alternating sides to create the snaking shape
const ANCHORS = [
  { x: 18, y: 12 }, // 1 — top-left
  { x: 82, y: 28 }, // 2 — top-right
  { x: 16, y: 48 }, // 3 — mid-left
  { x: 80, y: 68 }, // 4 — mid-right
  { x: 50, y: 90 }, // 5 — bottom-center
];

const ICONS = [Sparkles, Compass, BookOpen, LineChart, Award];

// Photos: 1 (classroom), 3 (regular classes), 5 (success — Nouha portrait)
const PHOTOS: Record<number, string> = {
  0: '/brand/classroom.jpg',
  2: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
  4: '/brand/nouha-portrait.jpg',
};

export function Journey() {
  const t = useTranslations('journey');
  const steps = t.raw('steps') as Step[];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // The drawn path length grows as user scrolls through the section
  const drawn = useTransform(scrollYProgress, [0.05, 0.85], [0, 1]);

  // Build a smooth winding path through the 5 anchors using cubic curves
  // viewBox 1000 wide × 1600 tall
  const path = buildWindingPath(ANCHORS);

  return (
    <section id="journey" ref={ref} className="relative isolate overflow-hidden bg-[var(--color-rlc-900)] py-24 lg:py-32 text-[var(--color-cream)]">
      {/* Subtle gold mesh background */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 gradient-mesh" />
      </div>
      <div className="grain" aria-hidden />

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
          {/* SVG winding path — absolute, scaled */}
          <div className="pointer-events-none absolute inset-0">
            <svg viewBox="0 0 1000 1600" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0BC65" stopOpacity="1" />
                  <stop offset="100%" stopColor="#C9A24A" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Background dashed path (always visible, faint) */}
              <path d={path} stroke="rgba(233, 210, 156, 0.18)" strokeWidth="2"
                strokeDasharray="8 12" fill="none" />
              {/* Animated draw-over */}
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

          {/* START tag (top-left, decorative handwritten-feel) */}
          <div className="pointer-events-none absolute start-[4%] top-[4%] -translate-y-1/2 select-none">
            <span className="font-[var(--font-display)] italic text-[var(--color-gold)] text-2xl lg:text-3xl">
              {t('start')}
            </span>
          </div>

          {/* The grid that lays out the cards at the anchor points */}
          <div className="relative grid grid-cols-12 gap-y-16 lg:gap-y-28" style={{ minHeight: 'min(1200px, 130vh)' }}>
            {steps.map((s, i) => {
              const Icon = ICONS[i];
              const a = ANCHORS[i];
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
                  style={{ marginTop: i === 0 ? 0 : undefined }}
                >
                  <div className={`relative grid gap-5 ${photo ? 'md:grid-cols-[180px_1fr]' : ''}`}>
                    {photo && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative aspect-square overflow-hidden rounded-sm ring-2 ring-[var(--color-gold)]/40 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
                      >
                        <Image src={photo} alt="" fill sizes="180px" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/40 to-transparent" />
                      </motion.div>
                    )}
                    <div className="relative">
                      {/* Number badge */}
                      <div className="inline-flex items-center gap-3">
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
                        <Icon className="h-5 w-5 text-[var(--color-cream)]/60" />
                      </div>
                      <h3 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-cream)] lg:text-3xl">
                        {s.title}
                      </h3>
                      <p className="mt-3 max-w-md text-[var(--color-cream)]/75 leading-relaxed">{s.body}</p>
                    </div>
                  </div>

                  {/* Dot on the path */}
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

          {/* FINISH tag (bottom-right) */}
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

/**
 * Builds a smooth cubic-bezier path connecting the given anchor points (in percent of viewBox).
 * The control points are offset horizontally to create gentle S-curves between anchors.
 */
function buildWindingPath(anchors: { x: number; y: number }[]): string {
  if (anchors.length === 0) return '';
  // Map percent to viewBox 1000x1600
  const pts = anchors.map((a) => ({ x: (a.x / 100) * 1000, y: (a.y / 100) * 1600 }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dy = curr.y - prev.y;
    // Control points pulled toward each other horizontally so curves are gentle
    const c1 = { x: prev.x, y: prev.y + dy * 0.55 };
    const c2 = { x: curr.x, y: curr.y - dy * 0.55 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

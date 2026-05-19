'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

export function Story() {
  const t = useTranslations('story');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['10%', reduced ? '0%' : '-10%']);

  return (
    <Section id="story" tone="cream">
      <div ref={ref} className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="display-lg mt-6 max-w-2xl text-[var(--color-rlc-900)]">{t('title')}</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl body-lg text-[var(--color-ink-soft)]">{t('p1')}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-5 max-w-xl body-lg text-[var(--color-ink-soft)]">{t('p2')}</p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-10 flex items-center gap-4">
              <SignatureSVG />
              <div>
                <div className="font-[var(--font-display)] text-lg text-[var(--color-rlc-900)]">{t('signature')}</div>
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">{t('signatureTitle')}</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal y={48}>
            <FramedPortrait y={imgY} />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function FramedPortrait({ y }: { y: import('framer-motion').MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="relative">
      {/* Offset gold double-frame line, behind */}
      <div aria-hidden className="pointer-events-none absolute -inset-3 lg:-inset-4">
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-sm border border-[var(--color-gold)]/55 lg:translate-x-4 lg:translate-y-4" />
      </div>

      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[var(--color-rlc-900)] ring-1 ring-[var(--color-line)] shadow-[0_30px_70px_-30px_rgba(8,57,34,0.45)]">
        <Image
          src="/brand/story.png"
          alt="Rai Language Center — three decades of language education"
          fill priority={false} sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/65 via-transparent to-transparent" />

        {/* EST 1995 seal in the upper-right corner */}
        <Seal />

        {/* Bottom info */}
        <div className="absolute inset-x-6 bottom-6 text-[var(--color-cream)]">
          <div className="text-xs uppercase tracking-[0.16em] opacity-80">EST. 1995</div>
          <div className="mt-1 font-[var(--font-display)] text-2xl">Latakia · لاذقية</div>
        </div>

        {/* Slow gold rim shimmer that travels around the edge */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, transparent 35%, rgba(233, 210, 156, 0.32) 50%, transparent 65%)',
            mixBlendMode: 'overlay',
          }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        />
      </div>

      {/* Four animated gold corner brackets — draw in on scroll into view */}
      <Corners />
    </motion.div>
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
      {/* Top-left */}
      <motion.path d="M 1 14 L 1 1 L 14 1" stroke="currentColor" strokeWidth="0.6" fill="none" variants={draw} />
      {/* Top-right */}
      <motion.path d="M 86 1 L 99 1 L 99 14" stroke="currentColor" strokeWidth="0.6" fill="none" variants={draw} />
      {/* Bottom-left */}
      <motion.path d="M 1 86 L 1 99 L 14 99" stroke="currentColor" strokeWidth="0.6" fill="none" variants={draw} />
      {/* Bottom-right */}
      <motion.path d="M 86 99 L 99 99 L 99 86" stroke="currentColor" strokeWidth="0.6" fill="none" variants={draw} />
    </motion.svg>
  );
}

function Seal() {
  return (
    <motion.div
      className="absolute end-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)]/95 text-[var(--color-rlc-900)] shadow-[0_8px_24px_-8px_rgba(201,162,74,0.7)]"
      initial={{ scale: 0, rotate: -25 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      <div className="text-center leading-none">
        <div className="font-[var(--font-display)] text-[0.62rem] uppercase tracking-[0.12em]">Est.</div>
        <div className="font-[var(--font-display)] text-base font-semibold">1995</div>
      </div>
      <motion.span
        aria-hidden
        className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/60"
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

function SignatureSVG() {
  return (
    <motion.svg viewBox="0 0 220 80" width="120" height="44" className="text-[var(--color-gold)]"
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
      <motion.path d="M10 50 C 30 10, 60 70, 80 40 S 130 10, 150 40 S 200 70, 210 30"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1, transition: { duration: 2, ease: [0.22, 1, 0.36, 1] } } }} />
    </motion.svg>
  );
}

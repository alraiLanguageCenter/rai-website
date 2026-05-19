'use client';

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

/* Floating background glyphs that drift across the band. */
const BG_GLYPHS = ['A', 'B', 'C', 'D', 'E', 'F', 'ع', 'ك', 'م', 'ن', 'و', 'ي'];

export function BrandStrip() {
  const t = useTranslations('brandStrip');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-6%']);
  const bgY = useTransform(scrollYProgress, [0, 1], ['10%', reduced ? '10%' : '-10%']);

  // Cursor spotlight
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 120, damping: 22 });
  const sy = useSpring(my, { stiffness: 120, damping: 22 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  const words = [t('learn'), t('connect'), t('succeed')];

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate overflow-hidden bg-[var(--color-rlc-900)] py-14 sm:py-20 lg:py-28 text-[var(--color-cream)]"
    >
      {/* Layer 1: cursor-following golden spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: useTransform(
            [sx, sy] as const,
            ([x, y]) =>
              `radial-gradient(700px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(201,162,74,0.22), transparent 60%)`,
          ),
        }}
      />

      {/* Layer 2: drifting alphabet glyphs in the background.
          Sizes are clamped so the largest glyphs don't dominate the band on phones. */}
      {!reduced && (
        <motion.div aria-hidden style={{ y: bgY }} className="pointer-events-none absolute inset-0">
          {BG_GLYPHS.map((g, i) => {
            const top = 8 + ((i * 19) % 80);
            const left = 4 + ((i * 31) % 92);
            const size = 2.2 + ((i * 13) % 40) / 10; // 2.2rem–6.1rem at md+
            const dur = 12 + (i % 7);
            const delay = (i * 0.7) % 6;
            const tone = i % 3 === 0 ? 'text-[var(--color-gold)]/30' : 'text-[var(--color-cream)]/[0.08]';
            // On phones, drop every other glyph and clamp size to keep the band airy.
            const hideOnMobile = i % 2 === 0 ? '' : 'hidden md:block';
            return (
              <motion.span
                key={`${g}-${i}`}
                className={`absolute select-none font-[var(--font-display)] ${tone} ${hideOnMobile}`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  fontSize: `clamp(1.4rem, ${size * 0.45}rem + 1.4vw, ${size}rem)`,
                  fontStyle: i % 2 ? 'italic' : undefined,
                }}
                initial={{ opacity: 0, y: 20, rotate: -6 + (i % 5) * 2 }}
                animate={{
                  opacity: [0, 0.9, 0.6, 0.9, 0],
                  y: [20, -10, 5, -8, 25],
                  rotate: [-6, 2, -3, 4, -6],
                }}
                transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                {g}
              </motion.span>
            );
          })}
        </motion.div>
      )}

      {/* Layer 3: gold curves */}
      <svg aria-hidden viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-full w-full opacity-35">
        <defs>
          <linearGradient id="bs-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0" />
            <stop offset="50%" stopColor="#E0BC65" stopOpacity="1" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,140 Q360,60 720,120 T1440,140"
          stroke="url(#bs-gold)" strokeWidth="1.8" fill="none"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M0,90 Q360,150 720,80 T1440,90"
          stroke="url(#bs-gold)" strokeWidth="1.2" fill="none" opacity="0.7"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
        <motion.path
          d="M0,40 Q420,110 840,60 T1440,30"
          stroke="url(#bs-gold)" strokeWidth="0.8" fill="none" opacity="0.45"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>

      {/* Layer 4: orbiting gold particles — show 8 on mobile, all 18 on md+. */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className={`absolute h-1 w-1 rounded-full bg-[var(--color-gold)] ${i >= 8 ? 'hidden md:block' : ''}`}
              style={{ top: `${(i * 53) % 100}%`, left: `${(i * 37) % 100}%`, opacity: 0.55 }}
              animate={{
                y: [0, -16, 0],
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.6, 1],
              }}
              transition={{ duration: 3.6 + (i % 5), delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Layer 5: content */}
      <motion.div
        style={{ x }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-5 sm:gap-6 sm:px-6 lg:px-10"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-8 sm:gap-y-3 lg:gap-x-16">
          {words.map((word, i) => (
            <KineticWord key={i} word={word} index={i} showDot={i < 2} reduced={!!reduced} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center text-[var(--color-cream)]/85"
        >
          {t('tagline')}
        </motion.p>

        {/* Animated underline beneath the tagline */}
        <motion.span
          aria-hidden
          className="block h-px w-full max-w-xs origin-center bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 0.8 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </section>
  );
}

/* -------------------- Word with kinetic letters + shimmer sweep -------------------- */

function KineticWord({
  word,
  index,
  showDot,
  reduced,
}: {
  word: string;
  index: number;
  showDot: boolean;
  reduced: boolean;
}) {
  const letters = Array.from(word);

  return (
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        show: {
          transition: { delayChildren: 0.18 * index, staggerChildren: reduced ? 0 : 0.04 },
        },
      }}
      className="display-lg relative inline-flex items-end font-[var(--font-display)] italic text-[var(--color-cream)]"
      style={{ perspective: 800 }}
    >
      {/* shimmer sweep overlay */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, transparent 35%, rgba(255,247,222,0.55) 50%, transparent 65%)',
            mixBlendMode: 'overlay',
          }}
          initial={{ x: '-110%' }}
          whileInView={{ x: '110%' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.7, delay: 0.6 + index * 0.18, ease: 'easeInOut' }}
        />
      )}

      <span className="inline-flex overflow-hidden">
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: '0.55em', rotateX: -45 },
              show: {
                opacity: 1, y: '0em', rotateX: 0,
                transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
              },
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        ))}
      </span>

      {showDot && (
        <motion.span
          aria-hidden
          className="ms-3 inline-block h-2 w-2 rounded-full bg-[var(--color-gold)] align-middle"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.6 + 0.18 * index, ease: 'backOut' }}
        />
      )}
    </motion.h2>
  );
}

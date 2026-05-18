'use client';

import Image from 'next/image';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Headphones, MessageCircle, BookOpen, PenLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KineticText } from '@/components/motion/KineticText';

const GLYPH_CYCLE = ['A', 'B', 'E', 'ع', 'ك'];

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Scroll parallax
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const glyphY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '40%']);
  const glyphOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-18%']);
  const logoY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '20%']);

  // Cursor spotlight + 3D tilt
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spotX = useSpring(mx, { stiffness: 120, damping: 22 });
  const spotY = useSpring(my, { stiffness: 120, damping: 22 });
  const tiltX = useTransform(spotY, [0, 1], [4, -4]);
  const tiltY = useTransform(spotX, [0, 1], [-4, 4]);

  // Morphing glyph
  const [glyphIdx, setGlyphIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setGlyphIdx((i) => (i + 1) % GLYPH_CYCLE.length), 3500);
    return () => clearInterval(id);
  }, [reduced]);

  // Ticker rotation
  const tickerLines = t.raw('ticker') as string[];
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % tickerLines.length), 3000);
    return () => clearInterval(id);
  }, [reduced, tickerLines.length]);

  // Greeting bubbles
  const greetings = t.raw('greetings') as { en: string; ar: string }[];
  const [greetIdx, setGreetIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setGreetIdx((i) => (i + 1) % greetings.length), 4200);
    return () => clearInterval(id);
  }, [reduced, greetings.length]);

  // Floating words
  const words = t.raw('floatingWords') as string[];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[var(--color-cream)]"
    >
      {/* Layer 1: Gradient mesh */}
      <div className="absolute inset-0 gradient-mesh" aria-hidden />
      <div className="grain" aria-hidden />

      {/* Layer 2: Cursor spotlight (radial gradient that follows mouse) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: useTransform(
            [spotX, spotY] as const,
            ([x, y]) =>
              `radial-gradient(560px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(201,162,74,0.18), transparent 70%)`,
          ),
        }}
      />

      {/* Layer 3: Big floating RLC logo behind */}
      <motion.div
        aria-hidden
        style={{ y: logoY }}
        animate={reduced ? undefined : { scale: [1, 1.04, 1], rotate: [-2, 2, -2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -end-24 -bottom-24 select-none opacity-[0.07]"
      >
        <Image src="/brand/rlc-logo.jpg" alt="" width={520} height={520} className="h-[520px] w-[520px] object-contain" />
      </motion.div>

      {/* Layer 4: Morphing huge glyph */}
      <motion.div
        aria-hidden
        style={{ y: glyphY, opacity: glyphOpacity }}
        className="pointer-events-none absolute -end-8 top-6 select-none font-[var(--font-display)] text-[clamp(18rem,32vw,32rem)] leading-none text-[var(--color-rlc-800)]/[0.07]"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={GLYPH_CYCLE[glyphIdx]}
            initial={{ opacity: 0, scale: 0.92, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.05, rotate: 5 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {GLYPH_CYCLE[glyphIdx]}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Layer 5: Second drifting glyph */}
      <motion.div
        aria-hidden
        style={{ y: glyphY, opacity: glyphOpacity }}
        className="pointer-events-none absolute -start-6 -bottom-20 select-none font-[var(--font-display)] text-[clamp(14rem,26vw,26rem)] leading-none text-[var(--color-gold)]/[0.10]"
      >
        {locale === 'ar' ? 'A' : 'ع'}
      </motion.div>

      {/* Layer 6: Floating English words drifting through space */}
      {!reduced && (
        <FloatingWords words={words} />
      )}

      {/* Layer 7: Floating language icons */}
      {!reduced && <FloatingIcons />}

      {/* Layer 8: Gold particles */}
      {!reduced &&
        Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
            style={{ top: `${(i * 73) % 100}%`, left: `${(i * 47) % 100}%`, opacity: 0.35 }}
            animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}

      {/* Layer 9: Greeting bubbles (right side, desktop only) */}
      <div className="pointer-events-none absolute end-8 top-1/2 hidden -translate-y-1/2 select-none lg:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={greetIdx}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-end gap-3"
          >
            <SpeechBubble side="right" tone="green">
              {greetings[greetIdx].en}
            </SpeechBubble>
            <SpeechBubble side="right" tone="gold" delay={0.25}>
              {greetings[greetIdx].ar}
            </SpeechBubble>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main content */}
      <motion.div
        style={{
          y: contentY,
          rotateX: reduced ? 0 : tiltX,
          rotateY: reduced ? 0 : tiltY,
          transformPerspective: 1200,
        }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 pb-20 lg:px-10 lg:pt-32"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow inline-flex items-center gap-3"
        >
          <span className="h-px w-10 bg-[var(--color-gold)]" />
          {t('eyebrow')}
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
        </motion.span>

        <div className="mt-6">
          <KineticText
            text={t('headline')}
            as="h1"
            className="display-xl font-[var(--font-display)] text-[var(--color-rlc-900)]"
            delay={0.2}
          />
          <ShimmerText delay={0.55}>
            <KineticText
              text={t('headlineAccent')}
              as="h1"
              className="display-xl font-[var(--font-display)] italic text-[var(--color-gold)]"
              delay={0.55}
            />
          </ShimmerText>
        </div>

        {/* Ticker */}
        <div className="mt-6 h-7 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIdx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-rlc-800)]"
            >
              <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]" />
              {tickerLines[tickerIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl body-lg text-[var(--color-ink-soft)]"
        >
          {t('lede')}
          <BlinkingCursor />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button href="#assess" size="lg" magnetic>
            {t('primaryCta')}
            <span aria-hidden className="rtl:rotate-180">→</span>
          </Button>
          <Button href="#courses" size="lg" variant="secondary">
            {t('secondaryCta')}
          </Button>
        </motion.div>

        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-10 end-10 hidden flex-col items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] lg:flex"
        >
          <span>{t('scrollHint')}</span>
          <motion.span
            className="block h-12 w-px bg-[var(--color-ink-soft)]/40"
            style={{ transformOrigin: 'top' }}
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* -------------------------- Sub-components -------------------------- */

function FloatingWords({ words }: { words: string[] }) {
  // 10 fixed positions across the viewport, each word gets one
  const placements = words.map((_, i) => ({
    // Spread evenly using hashed-feeling positions
    top: `${5 + ((i * 41) % 90)}%`,
    left: `${4 + ((i * 67) % 92)}%`,
    delay: i * 0.4,
    duration: 9 + (i % 4),
    depth: 0.3 + ((i % 3) * 0.25),
    fontSize: 0.75 + ((i * 13) % 7) * 0.08,
    rotate: ((i * 11) % 11) - 5,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {words.map((w, i) => {
        const p = placements[i];
        return (
          <motion.span
            key={`${w}-${i}`}
            className="absolute select-none font-[var(--font-display)] italic text-[var(--color-rlc-800)]/30"
            style={{
              top: p.top,
              left: p.left,
              fontSize: `${p.fontSize}rem`,
              filter: `blur(${(1 - p.depth) * 1.2}px)`,
            }}
            initial={{ opacity: 0, y: 30, rotate: p.rotate }}
            animate={{
              opacity: [0, p.depth * 0.7, 0],
              y: [30, -30, -50],
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

function FloatingIcons() {
  const items = [
    { Icon: MessageCircle, top: '20%', left: '8%', size: 18, delay: 0 },
    { Icon: Headphones,    top: '70%', left: '12%', size: 22, delay: 1.2 },
    { Icon: BookOpen,      top: '30%', left: '88%', size: 20, delay: 0.6 },
    { Icon: PenLine,       top: '78%', left: '82%', size: 18, delay: 1.8 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {items.map(({ Icon, top, left, size, delay }, i) => (
        <motion.span
          key={i}
          className="absolute text-[var(--color-gold)]/45"
          style={{ top, left, width: size, height: size }}
          animate={{ y: [0, -10, 0], rotate: [0, 5, -3, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6 + i, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <Icon className="h-full w-full" />
        </motion.span>
      ))}
    </div>
  );
}

function SpeechBubble({
  children,
  side,
  tone,
  delay = 0,
}: {
  children: React.ReactNode;
  side: 'left' | 'right';
  tone: 'green' | 'gold';
  delay?: number;
}) {
  const greenCls = 'bg-[var(--color-rlc-800)] text-[var(--color-cream)]';
  const goldCls = 'bg-[var(--color-gold)] text-[var(--color-rlc-900)]';
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'right' ? 12 : -12, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={`relative inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium shadow-[0_12px_28px_-14px_rgba(8,57,34,0.45)] ${tone === 'green' ? greenCls : goldCls}`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute h-3 w-3 rotate-45 ${tone === 'green' ? greenCls : goldCls} ${side === 'right' ? '-end-1 bottom-2' : '-start-1 bottom-2'}`}
      />
    </motion.div>
  );
}

function ShimmerText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <div className="relative inline-block">
      {children}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, transparent 35%, rgba(255,247,222,0.85) 50%, transparent 65%)',
            mixBlendMode: 'overlay',
          }}
          initial={{ x: '-110%' }}
          animate={{ x: '110%' }}
          transition={{ duration: 2.4, delay: delay + 1.2, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      aria-hidden
      className="ms-1 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-[var(--color-rlc-700)] align-middle"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.51, 1] }}
    />
  );
}

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
import { Headphones, MessageCircle, BookOpen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KineticText } from '@/components/motion/KineticText';
import { Typewriter } from '@/components/motion/Typewriter';

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

      {/* Layer 6: Floating English words drifting through space.
          Hidden on small screens — they crowd narrow viewports. */}
      {!reduced && (
        <div className="hidden md:block">
          <FloatingWords words={words} />
        </div>
      )}

      {/* Layer 7: Floating language icons (md+ only). */}
      {!reduced && (
        <div className="hidden md:block">
          <FloatingIcons />
        </div>
      )}

      {/* Layer 8: Gold particles — fewer on small screens. */}
      {!reduced &&
        Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`absolute h-1 w-1 rounded-full bg-[var(--color-gold)] ${i >= 6 ? 'hidden sm:block' : ''}`}
            style={{ top: `${(i * 73) % 100}%`, left: `${(i * 47) % 100}%`, opacity: 0.35 }}
            animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}

      {/* Layer 9: Scattered greeting bubbles — three bubbles at randomized right-half positions per cycle */}
      <div className="pointer-events-none absolute inset-0 hidden select-none lg:block">
        <ScatteredBubbles greetings={greetings} cycle={greetIdx} />
      </div>

      {/* Main content */}
      <motion.div
        style={{
          y: contentY,
          rotateX: reduced ? 0 : tiltX,
          rotateY: reduced ? 0 : tiltY,
          transformPerspective: 1200,
        }}
        className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-10 lg:pt-32"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow inline-flex items-center gap-3"
        >
          <span className="h-px w-10 bg-[var(--color-gold)]" />
          {t('eyebrow')}
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
          transition={{ duration: 0.7, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl body-lg text-[var(--color-ink-soft)]"
        >
          <Typewriter
            text={t('lede')}
            start="mount"
            delay={1.15}
            speed={42}
            caret
            caretClassName="bg-[var(--color-rlc-700)]"
          />
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
  // Denser placement: stagger each word into a 7-column × 7-row jitter grid,
  // then add deterministic pseudo-random offsets so it doesn't look like a grid.
  // Many style variations: size, italic, weight, color tone, drift direction.
  const placements = words.map((_, i) => {
    const r1 = ((i * 2654435761) % 1000) / 1000;
    const r2 = ((i * 1597334677) % 1000) / 1000;
    const r3 = ((i * 374761393)  % 1000) / 1000;
    const r4 = ((i * 911) % 1000) / 1000;
    const r5 = ((i * 2147483647) % 1000) / 1000;
    // 7×7 jitter grid
    const cols = 7, rows = 7;
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const cellW = 92 / cols;
    const cellH = 92 / rows;
    const top  = 4 + row * cellH + r1 * cellH * 0.85;
    const left = 4 + col * cellW + r2 * cellW * 0.85;
    // Drift direction: 0 = up, 1 = down, 2 = right, 3 = left (modular variety)
    const dir = i % 4;
    const driftY = dir === 0 ? [30, -30, -55] : dir === 1 ? [-30, 30, 55] : [0, -8, 5];
    const driftX = dir === 2 ? [0, 18, 6] : dir === 3 ? [0, -18, -6] : [0, 4, -2];
    return {
      top: `${top}%`,
      left: `${left}%`,
      delay: r3 * 9,
      duration: 6 + r4 * 8,
      depth: 0.2 + r1 * 0.75,
      fontSize: 0.55 + r2 * 1.7,   // wider size range: 0.55–2.25rem
      rotate: r3 * 22 - 11,         // wider rotation: ±11°
      italic: r4 > 0.55,
      goldTint: r1 > 0.7,
      heavy: r5 > 0.82,             // a few bold words
      script: r5 > 0.92,             // very few in script-feel
      driftY,
      driftX,
    };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {words.map((w, i) => {
        const p = placements[i];
        const colorClass = p.goldTint ? 'text-[var(--color-gold)]/55' : 'text-[var(--color-rlc-800)]/40';
        return (
          <motion.span
            key={`${w}-${i}`}
            className={`absolute select-none whitespace-nowrap font-[var(--font-display)] ${p.italic ? 'italic' : ''} ${p.heavy ? 'font-semibold' : 'font-normal'} ${colorClass}`}
            style={{
              top: p.top,
              left: p.left,
              fontSize: `${p.fontSize}rem`,
              filter: `blur(${(1 - p.depth) * 1.5}px)`,
              letterSpacing: p.italic ? '-0.01em' : p.script ? '0.06em' : '0.01em',
              fontStyle: p.script ? 'italic' : undefined,
              transform: p.script ? 'skewX(-6deg)' : undefined,
            }}
            initial={{ opacity: 0, y: p.driftY[0], x: p.driftX[0], rotate: p.rotate }}
            animate={{
              opacity: [0, p.depth * 0.85, 0],
              y: p.driftY,
              x: p.driftX,
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

/**
 * Three speech bubbles placed at scattered positions on the "end" side
 * (visually right in LTR, left in RTL). Each cycle:
 *  - picks 3 different greetings, never repeating any from the previous cycle
 *  - mixes EN/AR languages randomly so the conversation feels natural
 *  - mixes green/gold tones
 *  - rotates one of 4 layout patterns so the position changes too
 */
function ScatteredBubbles({
  greetings,
  cycle,
}: {
  greetings: { en: string; ar: string }[];
  cycle: number;
}) {
  // Track which greetings were used in the previous cycle so we never repeat them
  const lastUsedRef = useRef<Set<number>>(new Set());

  // Deterministic pseudo-random by cycle so renders are stable
  function rng(seed: number) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }
  const r = rng(cycle * 7 + 13);

  // Pick 5 greetings that weren't used last cycle
  const PER_CYCLE = 5;
  const available = greetings
    .map((g, i) => ({ g, i }))
    .filter((p) => !lastUsedRef.current.has(p.i));
  const pool = available.length >= PER_CYCLE ? available : greetings.map((g, i) => ({ g, i }));
  const shuffled = [...pool].sort(() => r() - 0.5);
  const picks = shuffled.slice(0, PER_CYCLE);
  lastUsedRef.current = new Set(picks.map((p) => p.i));

  // Mix languages and tones each cycle. We just round-robin both — the
  // greeting array already mixes scripts, so the visible variety comes from
  // the data, not the rotation.
  const langPattern: ('en' | 'ar')[] = r() > 0.5
    ? ['en', 'ar', 'en', 'ar', 'en']
    : ['ar', 'en', 'ar', 'en', 'ar'];
  const tonePattern: ('green' | 'gold')[] = r() > 0.5
    ? ['gold', 'green', 'gold', 'green', 'gold']
    : ['green', 'gold', 'green', 'gold', 'green'];

  // 4 layout patterns, each placing 5 bubbles at varied positions along the
  // "end" side. Uses logical end-positioning so RTL flips automatically.
  const LAYOUTS: { top: string; end: string; delay: number }[][] = [
    [
      { top: '18%', end: '12%', delay: 0 },
      { top: '32%', end: '6%',  delay: 0.12 },
      { top: '46%', end: '18%', delay: 0.24 },
      { top: '60%', end: '5%',  delay: 0.36 },
      { top: '74%', end: '14%', delay: 0.48 },
    ],
    [
      { top: '22%', end: '4%',  delay: 0 },
      { top: '34%', end: '16%', delay: 0.12 },
      { top: '50%', end: '5%',  delay: 0.24 },
      { top: '64%', end: '12%', delay: 0.36 },
      { top: '78%', end: '6%',  delay: 0.48 },
    ],
    [
      { top: '20%', end: '14%', delay: 0 },
      { top: '36%', end: '5%',  delay: 0.12 },
      { top: '50%', end: '15%', delay: 0.24 },
      { top: '62%', end: '7%',  delay: 0.36 },
      { top: '76%', end: '16%', delay: 0.48 },
    ],
    [
      { top: '20%', end: '8%',  delay: 0 },
      { top: '34%', end: '15%', delay: 0.12 },
      { top: '48%', end: '4%',  delay: 0.24 },
      { top: '64%', end: '14%', delay: 0.36 },
      { top: '78%', end: '8%',  delay: 0.48 },
    ],
  ];
  const layout = LAYOUTS[cycle % LAYOUTS.length];

  return (
    <AnimatePresence mode="wait">
      <motion.div key={cycle} className="absolute inset-0">
        {layout.map((spot, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.7, delay: spot.delay, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
            style={{ top: spot.top, insetInlineEnd: spot.end }}
          >
            <SpeechBubble side="right" tone={tonePattern[i] ?? 'green'}>
              {langPattern[i] === 'en' ? picks[i]?.g.en : picks[i]?.g.ar}
            </SpeechBubble>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
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

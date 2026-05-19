'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';

type Props = {
  text: string;
  /** Seconds to wait before typing starts after the element becomes visible. */
  delay?: number;
  /** Characters per second. */
  speed?: number;
  /** When to start: 'mount' (immediately) or 'inView' (when scrolled into view, default). */
  start?: 'mount' | 'inView';
  /** Show the blinking caret. */
  caret?: boolean;
  /** Tailwind classes for the caret colour — defaults to currentColor. */
  caretClassName?: string;
  className?: string;
};

/**
 * A character-by-character typewriter. Uses requestAnimationFrame for smooth pacing,
 * respects prefers-reduced-motion (renders full text immediately), and supports both
 * immediate-on-mount and in-view triggering. The caret blinks after typing finishes.
 */
export function Typewriter({
  text,
  delay = 0,
  speed = 32,
  start = 'inView',
  caret = true,
  caretClassName,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const trigger = start === 'mount' ? true : inView;

  const [shown, setShown] = useState(reduced ? text : '');
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (reduced) { setShown(text); setDone(true); return; }
    if (!trigger) return;

    let rafId: number | null = null;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now + delay * 1000;
      const elapsed = (now - startedAt) / 1000; // seconds since typing should begin
      if (elapsed < 0) { rafId = requestAnimationFrame(tick); return; }
      const target = Math.min(text.length, Math.floor(elapsed * speed));
      setShown(text.slice(0, target));
      if (target < text.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [text, trigger, reduced, delay, speed]);

  return (
    <span ref={ref} className={className}>
      {shown}
      {caret && (
        <motion.span
          aria-hidden
          className={`ms-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] align-middle ${caretClassName ?? 'bg-current'}`}
          animate={done ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
          transition={done ? { duration: 1, repeat: Infinity, times: [0, 0.5, 0.51, 1], ease: 'linear' } : { duration: 0 }}
        />
      )}
    </span>
  );
}

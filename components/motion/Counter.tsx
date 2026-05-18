'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

export function Counter({ to, duration = 1.8, suffix = '', prefix = '' }: { to: number; duration?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const locale = useLocale();
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US');

  useEffect(() => {
    if (!inView) return;
    if (reduced) { setValue(to); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration, reduced]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {prefix}{formatter.format(value)}{suffix}
    </motion.span>
  );
}

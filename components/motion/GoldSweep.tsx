'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function GoldSweep({ flip = false }: { flip?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <div className="relative h-16 lg:h-24 overflow-hidden bg-[var(--color-cream)]" aria-hidden>
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full ${flip ? 'scale-y-[-1]' : ''}`}
      >
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0" />
            <stop offset="50%" stopColor="#E0BC65" stopOpacity="1" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,60 Q360,10 720,55 T1440,60"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M0,70 Q360,30 720,65 T1440,70"
          stroke="url(#goldGrad)"
          strokeWidth="0.8"
          fill="none"
          opacity="0.5"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
    </div>
  );
}

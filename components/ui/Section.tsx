import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  id?: string;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  tone?: 'cream' | 'ivory' | 'rlc' | 'rlc-dark';
};

const tones = {
  cream: 'bg-[var(--color-cream)] text-[var(--color-ink)]',
  ivory: 'bg-[var(--color-ivory)] text-[var(--color-ink)]',
  rlc: 'bg-[var(--color-rlc-100)] text-[var(--color-ink)]',
  'rlc-dark': 'bg-[var(--color-rlc-900)] text-[var(--color-cream)]',
} as const;

export function Section({ id, children, className, bleed = false, tone = 'cream' }: Props) {
  return (
    <section id={id} className={cn('relative scroll-mt-24', tones[tone], bleed ? '' : 'py-24 lg:py-36', className)}>
      {!bleed && <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">{children}</div>}
      {bleed && children}
    </section>
  );
}

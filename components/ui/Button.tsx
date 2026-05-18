'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Magnetic } from '@/components/motion/Magnetic';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-cream)] disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-rlc-800)] text-[var(--color-cream)] hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5 shadow-[0_10px_30px_-12px_rgba(8,57,34,0.55)]',
  secondary:
    'bg-transparent text-[var(--color-rlc-800)] ring-1 ring-[var(--color-rlc-800)]/30 hover:ring-[var(--color-rlc-800)] hover:bg-[var(--color-rlc-800)]/5',
  ghost: 'bg-transparent text-[var(--color-rlc-800)] hover:text-[var(--color-gold)]',
  gold:
    'bg-[var(--color-gold)] text-[var(--color-rlc-900)] hover:bg-[var(--color-gold-bright)] hover:-translate-y-0.5 shadow-[0_10px_30px_-12px_rgba(201,162,74,0.6)]',
};

const sizes: Record<Size, string> = {
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

type Common = {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  className?: string;
  children: React.ReactNode;
};

type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };
type AsLink = Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string };
export type ButtonProps = AsButton | AsLink;

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'primary', size = 'md', magnetic = false, className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  const inner =
    'href' in props && props.href !== undefined ? (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={props.href} className={classes}
            {...(props as Omit<AsLink, keyof Common | 'href'>)}>
        {children}
      </Link>
    ) : (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={classes}
              {...(props as Omit<AsButton, keyof Common>)}>
        {children}
      </button>
    );
  if (magnetic) return <Magnetic strength={0.25}>{inner}</Magnetic>;
  return inner;
});

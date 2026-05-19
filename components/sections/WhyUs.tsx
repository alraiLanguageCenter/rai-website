'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Award, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';

type Item = { title: string; body: string };
const icons = [Award, Sparkles, Users, TrendingUp];

export function WhyUs() {
  const t = useTranslations('why');
  const items = t.raw('items') as Item[];

  return (
    <Section id="why" tone="cream">
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--color-gold)]" />{t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-3 md:gap-5 md:[grid-auto-flow:dense]">
        <Reveal className="md:col-span-3 md:row-span-2" delay={0.05}><FeatureTile item={items[0]} Icon={icons[0]} large /></Reveal>
        <Reveal className="md:col-span-3 md:row-span-2" delay={0.12}>
          <ImageTile src="/brand/classroom.jpg" label="curriculum" item={items[1]} />
        </Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.18}><FeatureTile item={items[2]} Icon={icons[2]} /></Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.24}><FeatureTile item={items[3]} Icon={icons[3]} /></Reveal>
        <Reveal className="md:col-span-2 md:row-span-1" delay={0.3}><AccentTile /></Reveal>
      </div>
    </Section>
  );
}

function FeatureTile({ item, Icon, large = false }: { item: Item; Icon: React.ComponentType<{ className?: string }>; large?: boolean }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-sm bg-[var(--color-ivory)] p-8 ring-1 ring-[var(--color-line)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(8,57,34,0.25)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-rlc-800)]/8 text-[var(--color-rlc-800)] transition group-hover:bg-[var(--color-gold)]/20 group-hover:text-[var(--color-gold)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`mt-8 font-[var(--font-display)] text-[var(--color-rlc-900)] ${large ? 'text-3xl' : 'text-xl'}`}>{item.title}</h3>
      <p className="mt-3 text-[var(--color-ink-soft)]">{item.body}</p>
    </div>
  );
}

function ImageTile({ src, label, item }: { src: string; label: string; item: Item }) {
  return (
    <div className="group relative h-full min-h-[260px] overflow-hidden rounded-sm bg-[var(--color-rlc-900)] ring-1 ring-[var(--color-line)]">
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-80 transition-transform duration-[1.8s] ease-out group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/95 via-[var(--color-rlc-900)]/45 to-[var(--color-rlc-900)]/10" />
      <div className="absolute inset-x-8 bottom-8 text-[var(--color-cream)]">
        <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-70">{label}</div>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl">{item.title}</h3>
        <p className="mt-2 max-w-md text-sm opacity-85">{item.body}</p>
      </div>
    </div>
  );
}

function AccentTile() {
  return (
    <div className="relative h-full overflow-hidden rounded-sm bg-[var(--color-rlc-900)] p-8 text-[var(--color-cream)]">
      <span aria-hidden className="absolute -end-10 -top-10 text-[14rem] leading-none text-[var(--color-gold)]/20 font-[var(--font-display)]">✦</span>
      <div className="relative">
        <div className="font-[var(--font-display)] text-5xl text-[var(--color-gold)]">A+</div>
        <p className="mt-3 max-w-[18ch] text-sm opacity-85">Top scores in IELTS &amp; TOEFL year after year.</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, Megaphone, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Section } from '@/components/ui/Section';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Announcement = {
  id: string;
  title_ar: string; title_en: string;
  body_ar: string | null; body_en: string | null;
  flyer_url: string | null;
  cta_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null;
};

/**
 * Announcements rendered as a horizontal scrolling row of compact cards.
 * Each card is animated, attractive, and links out to its CTA. Auto-scrolls
 * gently and supports drag, arrow-key, and chevron navigation.
 */
export function Announcements() {
  const t = useTranslations('announcements');
  const locale = useLocale() as 'ar' | 'en';
  const [items, setItems] = useState<Announcement[] | null>(null);
  const reduced = useReducedMotion();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    dragFree: false,
  });

  // Pull the announcements
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error } = await sb
          .from('announcements')
          .select('id,title_ar,title_en,body_ar,body_en,flyer_url,cta_url,cta_label_ar,cta_label_en')
          .order('sort_order', { ascending: true })
          .limit(12);
        if (!alive) return;
        if (error) { setItems([]); return; }
        setItems((data ?? []) as Announcement[]);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Auto-advance one card every 5s
  useEffect(() => {
    if (!emblaApi || !items || items.length < 2 || reduced) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [emblaApi, items, reduced]);

  // Hide entirely if nothing to show
  if (items !== null && items.length === 0) return null;

  return (
    <Section id="announcements" tone="ivory" bleed className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      {/* Layered backdrop:
           - A soft cream→ivory→cream vertical gradient gives the section more
             warmth than the flat rlc-100 it had before.
           - A subtle dotted texture grid adds quiet pattern without competing
             with the headline.
           - Two drifting gold/green blobs maintain the ambient motion.
           - A gold-tipped hairline along the top edge anchors the section. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)] via-[var(--color-ivory)] to-[var(--color-cream)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(8,57,34,0.35) 1px, transparent 1.5px)',
            backgroundSize: '22px 22px',
          }}
        />
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/60 to-transparent" />
      </div>
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -end-20 -top-20 h-72 w-72 rounded-full bg-[var(--color-gold)]/20 blur-3xl"
            animate={{ y: [0, 18, 0], x: [0, -10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -start-24 bottom-0 h-80 w-80 rounded-full bg-[var(--color-rlc-700)]/15 blur-3xl"
            animate={{ y: [0, -20, 0], x: [0, 12, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Reveal>
              <span className="eyebrow inline-flex items-center gap-3">
                <Megaphone className="h-3.5 w-3.5 text-[var(--color-gold)]" />
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display-md mt-3 max-w-3xl text-[var(--color-rlc-900)] sm:display-lg sm:mt-6">{t('title')}</h2>
            </Reveal>
          </div>

          {items && items.length > 1 && (
            <Reveal delay={0.2}>
              <div className="flex items-center gap-2">
                <button onClick={() => emblaApi?.scrollPrev()} aria-label="Previous"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-rlc-800)] ring-1 ring-[var(--color-line)] transition hover:bg-[var(--color-rlc-100)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(8,57,34,0.4)]">
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
                <button onClick={() => emblaApi?.scrollNext()} aria-label="Next"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(8,57,34,0.55)]">
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {/* Horizontal scrolling row */}
      <div className="relative mt-8 sm:mt-10">
        {items === null ? (
          <div className="mx-auto grid h-44 max-w-7xl place-items-center px-6 lg:px-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 px-6 sm:gap-5 lg:px-10">
              {items.map((a, i) => (
                <AnnouncementCard key={a.id} item={a} locale={locale} index={i} viewFlyerLabel={t('viewFlyer')} />
              ))}
              {/* Spacer so the last card has trailing breathing room */}
              <div className="shrink-0 w-2" aria-hidden />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* -------------------- Card -------------------- */

function AnnouncementCard({
  item, locale, index, viewFlyerLabel,
}: {
  item: Announcement;
  locale: 'ar' | 'en';
  index: number;
  viewFlyerLabel: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const title = locale === 'ar' ? item.title_ar : item.title_en;
  const body = locale === 'ar' ? item.body_ar : item.body_en;
  const ctaLabel = locale === 'ar'
    ? (item.cta_label_ar ?? viewFlyerLabel)
    : (item.cta_label_en ?? viewFlyerLabel);

  const Card = (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: 0.05 * (index % 4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -6, scale: 1.01 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-md bg-[var(--color-cream)] ring-1 ring-[var(--color-line)] shadow-[0_18px_40px_-24px_rgba(8,57,34,0.35)] transition-shadow hover:shadow-[0_28px_60px_-20px_rgba(8,57,34,0.45)]"
    >
      {/* Top media — small thumbnail or layered placeholder.
          The placeholder is now a quiet, layered composition: radial gold glow
          on the corner, a centred ✦ glyph, and three small twinkling sparkles
          for life. Looks intentional, not "image missing". */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[var(--color-rlc-800)] via-[var(--color-rlc-700)] to-[var(--color-rlc-900)] sm:h-36">
        {item.flyer_url ? (
          <img
            src={item.flyer_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0">
            {/* Soft gold corner glow */}
            <span aria-hidden className="absolute -end-8 -top-8 h-28 w-28 rounded-full bg-[var(--color-gold)]/25 blur-2xl" />
            <span aria-hidden className="absolute -start-10 -bottom-8 h-24 w-24 rounded-full bg-[var(--color-rlc-700)]/40 blur-2xl" />
            {/* Centred glyph */}
            <div className="absolute inset-0 grid place-items-center font-[var(--font-display)] text-[5rem] leading-none text-[var(--color-gold)]/25 sm:text-[6rem]">✦</div>
            {/* Three twinkling sparkles */}
            {!reduced && [
              { top: '18%', start: '20%', d: 2.6, dl: 0 },
              { top: '70%', start: '78%', d: 3.0, dl: 0.6 },
              { top: '38%', start: '70%', d: 3.4, dl: 1.2 },
            ].map((s, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute h-1 w-1 rounded-full bg-[var(--color-gold)]"
                style={{ top: s.top, insetInlineStart: s.start, opacity: 0.5 }}
                animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.25, 0.9, 0.25] }}
                transition={{ duration: s.d, repeat: Infinity, delay: s.dl, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}
        {/* Dark gradient + gold sweep over media */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-rlc-900)]/80 via-[var(--color-rlc-900)]/25 to-transparent" />
        {!reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(110deg, transparent 35%, rgba(233, 210, 156, 0.32) 50%, transparent 65%)',
              mixBlendMode: 'overlay',
            }}
            initial={{ x: '-110%' }}
            animate={{ x: '110%' }}
            transition={{ duration: 3.5, delay: 0.6 + (index % 4) * 0.4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
          />
        )}
        {/* "NEW" badge */}
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-rlc-900)] shadow-[0_8px_18px_-8px_rgba(201,162,74,0.7)]">
          <Sparkles className="h-3 w-3" /> {locale === 'ar' ? 'جديد' : 'New'}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-[var(--font-display)] text-lg leading-tight text-[var(--color-rlc-900)] sm:text-xl">
          {title}
        </h3>
        {body && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {body}
          </p>
        )}
        {item.cta_url && (
          <div className="mt-auto pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-rlc-800)] transition group-hover:text-[var(--color-gold)]">
              {ctaLabel}
              <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-[-90deg]" />
            </span>
          </div>
        )}
      </div>

      {/* Bottom gold hairline that grows on hover */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 w-0 bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-gold-bright)] to-[var(--color-gold)] transition-all duration-500 group-hover:w-full" />
    </motion.article>
  );

  // Each card is a fixed-width slide. Sizing tuned so 1.3 cards show on phones,
  // 2 on small tablets, and 3-4 on desktop.
  const wrapperCls = 'group relative block shrink-0 basis-[78%] sm:basis-[44%] lg:basis-[30%] xl:basis-[24%]';

  if (item.cta_url) {
    return (
      <a ref={ref} href={item.cta_url} target="_blank" rel="noreferrer noopener" className={wrapperCls}>
        {Card}
      </a>
    );
  }
  return <div className={wrapperCls}>{Card}</div>;
}

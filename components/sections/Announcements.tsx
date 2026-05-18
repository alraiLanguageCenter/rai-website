'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Megaphone } from 'lucide-react';
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

export function Announcements() {
  const t = useTranslations('announcements');
  const locale = useLocale() as 'ar' | 'en';
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error } = await sb
          .from('announcements')
          .select('id,title_ar,title_en,body_ar,body_en,flyer_url,cta_url,cta_label_ar,cta_label_en')
          .order('sort_order', { ascending: true })
          .limit(6);
        if (!alive) return;
        if (error) { setItems([]); return; }
        setItems((data ?? []) as Announcement[]);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (!items || items.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [items]);

  // Hide entirely if nothing to show
  if (items !== null && items.length === 0) return null;

  return (
    <Section id="announcements" tone="rlc">
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3">
          <Megaphone className="h-3.5 w-3.5 text-[var(--color-gold)]" />
          {t('eyebrow')}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="display-lg mt-6 max-w-3xl text-[var(--color-rlc-900)]">{t('title')}</h2>
      </Reveal>

      <div className="mt-12 relative min-h-[280px]">
        {items === null ? (
          <div className="grid h-72 place-items-center rounded-sm bg-[var(--color-cream)]/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-rlc-700)] border-t-transparent" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.article key={items[active].id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-8 rounded-sm bg-[var(--color-cream)] p-6 ring-1 ring-[var(--color-line)] lg:grid-cols-2 lg:p-10">
              {items[active].flyer_url ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm ring-1 ring-[var(--color-line)]">
                  <img src={items[active].flyer_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ) : (
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[var(--color-rlc-800)]">
                  <div className="absolute inset-0 grid place-items-center text-[8rem] text-[var(--color-gold)]/15 font-[var(--font-display)]">✦</div>
                </div>
              )}
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-[var(--font-display)] text-3xl text-[var(--color-rlc-900)]">
                    {locale === 'ar' ? items[active].title_ar : items[active].title_en}
                  </h3>
                  <p className="mt-4 text-[var(--color-ink-soft)] whitespace-pre-line">
                    {locale === 'ar' ? items[active].body_ar : items[active].body_en}
                  </p>
                </div>
                {items[active].cta_url && (
                  <a href={items[active].cta_url!} target="_blank" rel="noreferrer noopener"
                     className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-rlc-800)] px-6 py-3 text-sm font-medium text-[var(--color-cream)] transition hover:bg-[var(--color-rlc-700)]">
                    {locale === 'ar'
                      ? (items[active].cta_label_ar ?? t('viewFlyer'))
                      : (items[active].cta_label_en ?? t('viewFlyer'))}
                    <ArrowUpRight className="h-4 w-4 rtl:rotate-90" />
                  </a>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        )}

        {items && items.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button key={i} type="button" onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-10 bg-[var(--color-rlc-800)]' : 'w-2.5 bg-[var(--color-ink)]/20 hover:bg-[var(--color-ink)]/40'}`} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

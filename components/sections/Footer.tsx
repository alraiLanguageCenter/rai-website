'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Facebook, Instagram, Youtube, MessageCircle, Users, Send, CheckCircle2, Loader2,
  Mail, Phone, User as UserIcon, MapPin, Clock, ArrowUpRight, Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { SITE } from '@/lib/site';
import { formatDigits } from '@/lib/utils';

const SOCIAL = [
  { href: SITE.social.facebookPage,  label: 'Facebook',          Icon: Facebook },
  { href: SITE.social.facebookGroup, label: 'Facebook Group',    Icon: Users },
  { href: SITE.social.instagram,     label: 'Instagram',         Icon: Instagram },
  { href: SITE.social.whatsapp,      label: 'WhatsApp Channel',  Icon: MessageCircle },
  { href: SITE.social.youtube,       label: 'YouTube',           Icon: Youtube },
];

/* Letters from many scripts that drift through the footer backdrop */
const BG_GLYPHS = ['A','B','E','é','ñ','ü','ع','ك','م','Я','Ω','π','中','文','日','あ','한','ש','अ','Ł'];

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale() as 'ar' | 'en';
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();

  const nav = [
    { href: '#story',    label: tNav('story') },
    { href: '#courses',  label: tNav('courses') },
    { href: '#journey',  label: tNav('journey') },
    { href: '#schedule', label: tNav('schedule') },
    { href: '#wins',     label: tNav('wins') },
    { href: '#assess',   label: tNav('assess') },
    { href: '#book',     label: tNav('contact') },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-[var(--color-rlc-900)] text-[var(--color-cream)]">
      {/* ===== Layered animated backdrop ===== */}
      <div className="grain opacity-[0.03]" aria-hidden />

      {/* Top edge: animated gold gradient bar */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(201,162,74,0) 25%, #E0BC65 50%, rgba(201,162,74,0) 75%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={reduced ? undefined : { backgroundPosition: ['-100% 0', '200% 0'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Drifting blurred green/gold orbs */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -start-32 top-10 h-80 w-80 rounded-full bg-[var(--color-gold)]/12 blur-3xl"
            animate={{ y: [0, 20, 0], x: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -end-32 bottom-0 h-96 w-96 rounded-full bg-[var(--color-rlc-700)]/22 blur-3xl"
            animate={{ y: [0, -24, 0], x: [0, -18, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 h-40 blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(201,162,74,0.10), transparent 70%)' }}
            animate={{ opacity: [0.55, 0.95, 0.55] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      {/* Subtle floating multilingual glyphs in the background */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {BG_GLYPHS.map((g, i) => {
            const top = 6 + ((i * 17) % 88);
            const left = 3 + ((i * 29) % 92);
            const size = 1.6 + ((i * 11) % 30) / 10; // 1.6–4.5 rem
            const dur = 13 + (i % 6);
            return (
              <motion.span
                key={`${g}-${i}`}
                className={`absolute select-none font-[var(--font-display)] ${i % 3 === 0 ? 'text-[var(--color-gold)]/15' : 'text-[var(--color-cream)]/[0.06]'} ${i % 2 ? 'italic' : ''}`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  fontSize: `clamp(1.2rem, ${size * 0.5}rem + 0.8vw, ${size}rem)`,
                }}
                initial={{ opacity: 0, y: 20, rotate: -8 + (i % 4) * 3 }}
                animate={{
                  opacity: [0, 0.85, 0.55, 0.85, 0],
                  y: [20, -10, 5, -8, 25],
                  rotate: [-8, 2, -3, 4, -8],
                }}
                transition={{ duration: dur, delay: (i * 0.6) % 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                {g}
              </motion.span>
            );
          })}
        </div>
      )}

      {/* Faint dotted grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(251,248,242,0.4) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        {/* ===== Main grid: form (left) | brand+nav+contact (right) ===== */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ---------- LEFT: Let us know form ---------- */}
          <FooterContactForm locale={locale} />

          {/* ---------- RIGHT: brand, social, nav, contact ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="flex flex-col gap-8"
          >
            {/* Brand block */}
            <div>
              <Logo variant="dark" />
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-md font-[var(--font-display)] text-2xl leading-tight text-[var(--color-cream)] lg:text-3xl"
              >
                {(t('tagline').split('. ') as string[]).map((part, i, arr) => {
                  const isLast = i === arr.length - 2; // emphasise "Succeed" / equivalent
                  return (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: 0.12 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={`inline-block ${isLast ? 'text-[var(--color-gold)]' : ''}`}
                    >
                      {part}{i < arr.length - 1 ? '. ' : ''}
                    </motion.span>
                  );
                })}
              </motion.p>

              {/* Social icons — magnetic hover + breathing ring */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {SOCIAL.map(({ href, label, Icon }, i) => (
                  <motion.a
                    key={label}
                    href={href} target="_blank" rel="noreferrer noopener" aria-label={label}
                    whileHover={reduced ? undefined : { scale: 1.14, y: -3, rotate: -4 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                    className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-cream)] ring-1 ring-[var(--color-cream)]/15 transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-rlc-900)] hover:ring-[var(--color-gold)]"
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {!reduced && (
                      <motion.span
                        aria-hidden
                        className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/40"
                        animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 3.2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                      />
                    )}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Nav + contact — two thin columns */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <FooterHeading>{locale === 'ar' ? 'تنقل' : 'Explore'}</FooterHeading>
                <ul className="mt-3 space-y-1.5">
                  {nav.map((n, i) => (
                    <motion.li
                      key={n.href}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ delay: 0.03 * i, duration: 0.4 }}
                    >
                      <a
                        href={n.href}
                        className="group inline-flex items-center gap-2 text-sm text-[var(--color-cream)]/80 transition hover:text-[var(--color-gold)]"
                      >
                        <span className="relative">
                          {n.label}
                          <span aria-hidden className="absolute -bottom-0.5 start-0 h-px w-0 bg-[var(--color-gold)] transition-all duration-300 group-hover:w-full" />
                        </span>
                        <ArrowUpRight className="h-3 w-3 -translate-y-0.5 opacity-0 transition group-hover:opacity-100 rtl:rotate-[-90deg]" />
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <FooterHeading>{locale === 'ar' ? 'تواصل معنا' : 'Get in touch'}</FooterHeading>
                <ul className="mt-3 space-y-3 text-sm">
                  {SITE.contact.phones.map((p) => (
                    <li key={p}>
                      <a
                        href={`tel:${p.replace(/\s/g, '')}`}
                        dir="ltr"
                        className="group inline-flex items-center gap-2 text-[var(--color-cream)]/85 transition hover:text-[var(--color-gold)]"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-gold)] transition group-hover:bg-[var(--color-gold)] group-hover:text-[var(--color-rlc-900)]">
                          <Phone className="h-3 w-3" />
                        </span>
                        <span>{formatDigits(p, locale)}</span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      href={`mailto:${SITE.contact.email}`}
                      dir="ltr"
                      className="group inline-flex items-center gap-2 text-[var(--color-cream)]/85 transition hover:text-[var(--color-gold)]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-gold)] transition group-hover:bg-[var(--color-gold)] group-hover:text-[var(--color-rlc-900)]">
                        <Mail className="h-3 w-3" />
                      </span>
                      <span>{SITE.contact.email}</span>
                    </a>
                  </li>
                  <li className="flex items-start gap-2 pt-1 text-[var(--color-cream)]/75">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-gold)]">
                      <MapPin className="h-3 w-3" />
                    </span>
                    <span>
                      {SITE.contact.addressLines[locale].map((line, i) => (
                        <span key={i} className="block leading-snug">{line}</span>
                      ))}
                    </span>
                  </li>
                  <li className="flex items-start gap-2 pt-1 text-[var(--color-cream)]/75">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-gold)]">
                      <Clock className="h-3 w-3" />
                    </span>
                    <span className="block leading-snug">
                      {locale === 'ar' ? 'السبت – الخميس' : 'Saturday – Thursday'}
                      <span className="block text-[var(--color-cream)]/55">9:00 – 21:00</span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===== Bottom strip: copyright + "since 1995" badge ===== */}
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-cream)]/15 pt-6 text-xs uppercase tracking-[0.14em] text-[var(--color-cream)]/60 md:flex-row md:items-center">
          <span>{t('rights', { year })}</span>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)]/5 px-3 py-1 ring-1 ring-[var(--color-cream)]/10"
          >
            <Sparkles className="h-3 w-3 text-[var(--color-gold)]" />
            {t('made')}
          </motion.span>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
      <span aria-hidden className="h-px w-6 bg-[var(--color-gold)]/55" />
      {children}
    </div>
  );
}

/* -------------------- Footer contact form -------------------- */
/**
 * Compact "let us know" form on the LEFT of the footer. Three fields
 * (name, email, phone) + a short message → POSTs to /api/contact, which
 * already saves the lead AND emails the admin inbox. Animated entrance,
 * cream-card on translucent green, gold submit button.
 */
function FooterContactForm({ locale }: { locale: 'ar' | 'en' }) {
  const isAr = locale === 'ar';
  const reduced = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/.+@.+\..+/.test(email)) {
      toast.error(isAr ? 'يرجى تعبئة الاسم والبريد بشكل صحيح.' : 'Please fill name and email correctly.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale,
          website: '',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          course: 'other',
          message: message.trim() || (isAr ? '(لا توجد رسالة)' : '(no message)'),
        }),
      });
      if (!res.ok) throw new Error('http ' + res.status);
      setDone(true);
      setName(''); setEmail(''); setPhone(''); setMessage('');
      toast.success(isAr ? 'وصلنا رسالتك. سنتواصل معك قريباً.' : 'Got it — we will reach out soon.');
    } catch {
      toast.error(isAr ? 'تعذّر الإرسال. حاول مرة أخرى.' : 'Could not send. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-[var(--color-cream)]/8 p-6 ring-1 ring-[var(--color-cream)]/15 backdrop-blur-sm sm:p-8"
    >
      {/* Gold corner glow + shimmer sweep */}
      {!reduced && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -end-12 -top-12 h-40 w-40 rounded-full bg-[var(--color-gold)]/20 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(201,162,74,0.18) 50%, transparent 65%)' }}
            initial={{ x: '-110%' }}
            animate={{ x: '110%' }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
          <Sparkles className="h-3 w-3" />
          {isAr ? 'تواصل معنا' : 'Let us know'}
        </div>
        <h3 className="mt-3 font-[var(--font-display)] text-2xl leading-tight text-[var(--color-cream)] sm:text-3xl">
          {isAr ? 'سؤال؟ سعر؟ سنردّ خلال يوم عمل.' : 'A question? A quote? We reply within one business day.'}
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--color-cream)]/70">
          {isAr
            ? 'اترك اسمك وبريدك، أو أضف رقم الواتساب لو تفضّل التواصل عبره.'
            : 'Leave your name and email — add a WhatsApp number if you prefer that instead.'}
        </p>

        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex items-start gap-3 rounded-md bg-[var(--color-cream)]/10 p-5 ring-1 ring-[var(--color-gold)]/40"
          >
            <motion.span
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]"
            >
              <CheckCircle2 className="h-5 w-5" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="font-[var(--font-display)] text-xl text-[var(--color-cream)]">
                {isAr ? 'وصلت رسالتك! 🌿' : 'Got your message! 🌿'}
              </div>
              <p className="mt-1 text-sm text-[var(--color-cream)]/75">
                {isAr ? 'سيتواصل معك فريق راي خلال يوم عمل واحد.' : 'Our team will reach out within one business day.'}
              </p>
              <button
                onClick={() => setDone(false)}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-cream)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-cream)] ring-1 ring-[var(--color-cream)]/20 hover:bg-[var(--color-cream)]/15"
              >
                {isAr ? 'إرسال رسالة أخرى' : 'Send another'}
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <FooterField icon={UserIcon} placeholder={isAr ? 'الاسم الكامل' : 'Full name'} value={name} onChange={setName} dir={isAr ? 'rtl' : 'ltr'} delay={0} />
            <FooterField icon={Mail} type="email" placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} value={email} onChange={setEmail} dir="ltr" delay={0.05} />
            <FooterField icon={Phone} type="tel" placeholder={isAr ? 'الواتساب (اختياري)' : 'WhatsApp (optional)'} value={phone} onChange={setPhone} dir="ltr" delay={0.1} wrap="sm:col-span-2" />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="sm:col-span-2"
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={isAr ? 'كيف نقدر نساعدك؟ (اختياري)' : 'How can we help? (optional)'}
                className="w-full resize-none rounded-sm border-0 bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-cream)]/20 placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </motion.div>
            <div className="sm:col-span-2">
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={reduced ? undefined : { y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-rlc-900)] shadow-[0_14px_32px_-14px_rgba(201,162,74,0.6)] transition disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {isAr ? 'جارٍ الإرسال...' : 'Sending…'}</>
                  : <>{isAr ? 'أرسل' : 'Send'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></>
                }
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

function FooterField({
  icon: Icon, placeholder, value, onChange, type = 'text', dir, delay = 0, wrap = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
  delay?: number;
  wrap?: string;
}) {
  return (
    <motion.label
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay }}
      className={`relative block ${wrap}`}
    >
      <span aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]/55">
        <Icon className="h-4 w-4" />
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full rounded-sm border-0 bg-[var(--color-cream)] py-3 ps-10 pe-4 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-cream)]/20 placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
      />
    </motion.label>
  );
}

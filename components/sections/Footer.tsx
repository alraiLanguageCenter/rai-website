'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Facebook, Instagram, Youtube, MessageCircle, Users, Send, CheckCircle2, Loader2, Mail, Phone, User as UserIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { SITE } from '@/lib/site';
import { formatDigits } from '@/lib/utils';

const SOCIAL = [
  { href: SITE.social.facebookPage, label: 'Facebook', Icon: Facebook },
  { href: SITE.social.facebookGroup, label: 'Facebook Group', Icon: Users },
  { href: SITE.social.instagram, label: 'Instagram', Icon: Instagram },
  { href: SITE.social.whatsapp, label: 'WhatsApp Channel', Icon: MessageCircle },
  { href: SITE.social.youtube, label: 'YouTube', Icon: Youtube },
];

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale() as 'ar' | 'en';
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();

  const nav = [
    { href: '#story', label: tNav('story') },
    { href: '#courses', label: tNav('courses') },
    { href: '#journey', label: tNav('journey') },
    { href: '#schedule', label: tNav('schedule') },
    { href: '#wins', label: tNav('wins') },
    { href: '#assess', label: tNav('assess') },
    { href: '#book', label: tNav('contact') },
  ];

  return (
    <footer className="relative overflow-hidden bg-[var(--color-rlc-900)] text-[var(--color-cream)]">
      <div className="grain opacity-[0.03]" aria-hidden />

      {/* Animated gold gradient bar across the top edge */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(201,162,74,0) 25%, #E0BC65 50%, rgba(201,162,74,0) 75%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={reduced ? undefined : { backgroundPosition: ['-100% 0', '200% 0'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Drifting blurred green/gold orbs */}
      {!reduced && (
        <>
          <motion.span aria-hidden className="pointer-events-none absolute -start-32 top-10 h-80 w-80 rounded-full bg-[var(--color-gold)]/8 blur-3xl"
            animate={{ y: [0, 20, 0], x: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.span aria-hidden className="pointer-events-none absolute -end-32 bottom-0 h-96 w-96 rounded-full bg-[var(--color-rlc-700)]/15 blur-3xl"
            animate={{ y: [0, -24, 0], x: [0, -18, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
        {/* === Let us know — compact contact form === */}
        <FooterContactForm locale={locale} />

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo variant="dark" />
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-sm font-[var(--font-display)] text-2xl text-[var(--color-cream)] lg:text-3xl"
            >
              {(t('tagline').split('. ') as string[]).map((part, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {part}{i < arr.length - 1 ? '. ' : ''}
                </motion.span>
              ))}
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {SOCIAL.map(({ href, label, Icon }, i) => (
                <motion.a
                  key={label}
                  href={href} target="_blank" rel="noreferrer noopener" aria-label={label}
                  whileHover={reduced ? undefined : { scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-cream)]/10 text-[var(--color-cream)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-rlc-900)]"
                >
                  <Icon className="h-4 w-4" />
                  {!reduced && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-1 rounded-full border border-[var(--color-gold)]/40"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                      transition={{ duration: 3.2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    />
                  )}
                </motion.a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-7">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="opacity-80 transition hover:opacity-100 hover:text-[var(--color-gold)]">{n.label}</a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-70">{locale === 'ar' ? 'تواصل معنا' : 'Get in touch'}</div>
            <div className="mt-3 space-y-1 text-sm">
              {SITE.contact.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/\s/g, '')}`}
                  /* dir is LTR in English so the +XXX prefix reads left-to-right;
                     in Arabic we keep LTR for the underlying tel URI but the
                     visible digits are converted to Arabic-Indic. */
                  dir="ltr"
                  className="block opacity-90 hover:text-[var(--color-gold)]"
                >
                  {formatDigits(p, locale)}
                </a>
              ))}
              <a href={`mailto:${SITE.contact.email}`} className="block opacity-90 hover:text-[var(--color-gold)]" dir="ltr">{SITE.contact.email}</a>
            </div>
            <div className="mt-5 text-sm opacity-80">
              {SITE.contact.addressLines[locale].map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-cream)]/15 pt-6 text-xs uppercase tracking-[0.14em] opacity-70 md:flex-row md:items-center">
          <span>{t('rights', { year })}</span>
          <span>{t('made')}</span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------- Footer contact form -------------------- */
/**
 * Compact "let us know" form embedded at the top of the footer. Three fields
 * (name, email, phone) + a short message → POSTs to /api/contact, which
 * already saves the lead AND emails the admin inbox. Confirmation flips the
 * panel to a small success state without a page reload.
 */
function FooterContactForm({ locale }: { locale: 'ar' | 'en' }) {
  const isAr = locale === 'ar';
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
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-10">
        {/* Title column */}
        <div>
          <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
            {isAr ? 'تواصل معنا' : 'Let us know'}
          </div>
          <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-cream)] sm:text-3xl">
            {isAr ? 'سؤال عام؟ سعر؟ سنردّ خلال يوم عمل.' : 'A question? A quote? We reply within one business day.'}
          </h3>
          <p className="mt-3 text-sm text-[var(--color-cream)]/70">
            {isAr
              ? 'اترك اسمك وبريدك وسنتواصل بأقرب وقت. لو تفضّل الواتساب، أضف رقمك أيضاً.'
              : 'Leave your name and email and we will get back to you. Prefer WhatsApp? Add your number too.'}
          </p>
        </div>

        {/* Form column */}
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-3 self-center rounded-md bg-[var(--color-cream)]/10 p-5 ring-1 ring-[var(--color-gold)]/40"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-rlc-800)] text-[var(--color-gold)]">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <div className="font-[var(--font-display)] text-xl text-[var(--color-cream)]">
                {isAr ? 'وصلت رسالتك! 🌿' : 'Got your message! 🌿'}
              </div>
              <p className="mt-1 text-sm text-[var(--color-cream)]/75">
                {isAr ? 'سيتواصل معك فريق راي خلال يوم عمل واحد.' : 'Our team will reach out within one business day.'}
              </p>
            </div>
            <button
              onClick={() => setDone(false)}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-cream)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-cream)] ring-1 ring-[var(--color-cream)]/20 hover:bg-[var(--color-cream)]/15"
            >
              {isAr ? 'إرسال رسالة أخرى' : 'Send another'}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <FooterField icon={UserIcon} placeholder={isAr ? 'الاسم الكامل' : 'Full name'} value={name} onChange={setName} dir={isAr ? 'rtl' : 'ltr'} />
            <FooterField icon={Mail} type="email" placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} value={email} onChange={setEmail} dir="ltr" />
            <FooterField icon={Phone} type="tel" placeholder={isAr ? 'الواتساب (اختياري)' : 'WhatsApp (optional)'} value={phone} onChange={setPhone} dir="ltr" />
            <div className="sm:col-span-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={isAr ? 'كيف نقدر نساعدك؟ (اختياري)' : 'How can we help? (optional)'}
                className="w-full resize-none rounded-sm border-0 bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-cream)]/20 placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-rlc-900)] shadow-[0_14px_32px_-14px_rgba(201,162,74,0.6)] transition hover:bg-[var(--color-gold-bright)] hover:-translate-y-0.5 disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {isAr ? 'جارٍ الإرسال...' : 'Sending…'}</>
                  : <>{isAr ? 'أرسل' : 'Send'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

function FooterField({
  icon: Icon, placeholder, value, onChange, type = 'text', dir,
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="relative block">
      <span aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]/60">
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
    </label>
  );
}

import { Resend } from 'resend';

type Locale = 'ar' | 'en';

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM ?? 'Rai Language Center <onboarding@resend.dev>';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

const COLORS = {
  cream:    '#FBF8F2',
  ivory:    '#F4ECDA',
  ink:      '#0F1B1D',
  inkSoft:  '#2A3739',
  green900: '#083922',
  green800: '#0E5132',
  green700: '#1A6F45',
  green100: '#E6F0EA',
  gold:     '#C9A24A',
  goldSoft: '#E9D29C',
} as const;

const SOCIAL = [
  { label: 'Facebook',         href: 'https://www.facebook.com/profile.php?id=61589138416877' },
  { label: 'Instagram',        href: 'https://www.instagram.com/rai_language_center/' },
  { label: 'YouTube',          href: 'https://youtube.com/@railanguagecenter' },
  { label: 'WhatsApp Channel', href: 'https://www.whatsapp.com/channel/0029Vb65VsA3QxS2UiyFkO2C' },
];

function strings(l: Locale) {
  return l === 'ar'
    ? {
        dir: 'rtl' as const,
        hello: 'مرحباً',
        tagline: 'تعلّم. تواصل. انجح.',
        addressTop: 'مركز الراعي للغات',
        addressBody: 'اللاذقية — سوريا · شارع عمر بن الخطاب',
        rights: '© ' + new Date().getFullYear() + ' مركز الراعي للغات. جميع الحقوق محفوظة.',
        callus: 'اتصل بنا',
        visit: 'زر الموقع',
      }
    : {
        dir: 'ltr' as const,
        hello: 'Hello',
        tagline: 'Learn. Connect. Succeed.',
        addressTop: 'Rai Language Center',
        addressBody: 'Latakia — Syria · Omar Ibn Al-Khattab Street',
        rights: '© ' + new Date().getFullYear() + ' Rai Language Center. All rights reserved.',
        callus: 'Call us',
        visit: 'Visit website',
      };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/**
 * Wrap any body HTML in the branded RLC frame (logo header, gold accent strip, footer with socials).
 */
function frame(body: string, opts: { locale: Locale; preheader: string; title: string }) {
  const s = strings(opts.locale);
  const isRtl = s.dir === 'rtl';
  return `<!doctype html>
<html lang="${opts.locale}" dir="${s.dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.ink};line-height:1.55;-webkit-font-smoothing:antialiased">
    <span style="display:none !important;color:transparent;visibility:hidden;opacity:0;height:0;width:0;font-size:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COLORS.cream};padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px -20px rgba(8,57,34,0.20)">

          <!-- Header: green bg + logo + tagline -->
          <tr><td style="background:${COLORS.green800};padding:28px 36px;color:${COLORS.cream}" align="${isRtl ? 'right' : 'left'}">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
              <td valign="middle" align="${isRtl ? 'right' : 'left'}">
                <img src="${SITE_URL}/brand/rlc-logo.jpg" width="48" height="48" alt="RLC" style="display:inline-block;vertical-align:middle;border:0;outline:none;text-decoration:none;border-radius:6px;background:${COLORS.green800}" />
                <span style="display:inline-block;vertical-align:middle;${isRtl ? 'margin-right' : 'margin-left'}:14px">
                  <span style="display:block;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7">${escapeHtml(s.addressTop)}</span>
                  <span style="display:block;margin-top:4px;font-size:13px;font-style:italic;color:${COLORS.gold}">${escapeHtml(s.tagline)}</span>
                </span>
              </td>
            </tr></table>
          </td></tr>

          <!-- Gold accent strip -->
          <tr><td style="height:3px;background:linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldSoft} 50%, ${COLORS.gold} 100%);line-height:3px;font-size:0">&nbsp;</td></tr>

          <!-- Body -->
          <tr><td style="padding:36px 36px 28px" align="${isRtl ? 'right' : 'left'}">
            ${body}
          </td></tr>

          <!-- Footer -->
          <tr><td style="background:${COLORS.ivory};padding:24px 36px;border-top:1px solid rgba(15,27,29,0.08)" align="${isRtl ? 'right' : 'left'}">
            <p style="margin:0 0 10px;font-size:13px;color:${COLORS.inkSoft}">
              ${escapeHtml(s.addressBody)}<br />
              <a href="tel:+96317256669" style="color:${COLORS.green800};text-decoration:none">+963 17 256 669</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}" style="color:${COLORS.green800};text-decoration:none">${escapeHtml(s.visit)}</a>
            </p>
            <p style="margin:10px 0 0;font-size:12px;color:${COLORS.inkSoft}">
              ${SOCIAL.map((soc) => `<a href="${soc.href}" style="color:${COLORS.green700};text-decoration:none;margin-${isRtl ? 'left' : 'right'}:10px">${soc.label}</a>`).join('·')}
            </p>
            <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.inkSoft};opacity:0.6">
              ${escapeHtml(s.rights)}
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Email: booking confirmation — sent when admin approves a slot.
 */
export async function sendBookingConfirmation(opts: {
  to: string;
  name: string;
  locale: Locale;
  slot: string;
  room?: string | null;
  notes?: string | null;
}) {
  const r = resend();
  if (!r) { console.warn('[email] Resend not configured'); return { ok: false, skipped: true as const }; }
  const s = strings(opts.locale);
  const isRtl = s.dir === 'rtl';
  const slotDate = new Date(opts.slot);
  const fmtDate = new Intl.DateTimeFormat(opts.locale === 'ar' ? 'ar-SY' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(slotDate);
  const fmtTime = new Intl.DateTimeFormat(opts.locale === 'ar' ? 'ar-SY' : 'en-GB', {
    hour: '2-digit', minute: '2-digit',
  }).format(slotDate);

  const title = opts.locale === 'ar'
    ? `تأكيد موعد التقييم — ${opts.name}`
    : `Your assessment is confirmed — ${opts.name}`;
  const preheader = opts.locale === 'ar'
    ? `موعدك: ${fmtDate} ${fmtTime}`
    : `Your slot: ${fmtDate} at ${fmtTime}`;

  const greeting = opts.locale === 'ar' ? 'يسعدنا تأكيد موعد تقييمك' : "We're delighted to confirm your assessment";
  const detail = opts.locale === 'ar'
    ? 'يرجى الحضور قبل ١٥ دقيقة من الموعد، ومعك بطاقة هويتك. سنزوّدك بدفتر وقلم.'
    : 'Please arrive 15 minutes before your slot and bring an ID. We will provide a notebook and pen.';
  const whenLabel = opts.locale === 'ar' ? 'الموعد' : 'When';
  const whereLabel = opts.locale === 'ar' ? 'القاعة' : 'Room';
  const notesLabel = opts.locale === 'ar' ? 'ملاحظات' : 'Notes';
  const ctaText = opts.locale === 'ar' ? 'اعرف المزيد عن دوراتنا' : 'Explore our courses';

  const body = `
    <p style="margin:0 0 6px;font-size:14px;color:${COLORS.green700};letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(s.hello)}</p>
    <h1 style="margin:6px 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;color:${COLORS.green900}">${escapeHtml(opts.name)},</h1>
    <p style="margin:0 0 18px;font-size:16px;color:${COLORS.inkSoft}">${escapeHtml(greeting)}.</p>

    <!-- When card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0">
      <tr><td style="background:${COLORS.ivory};border-${isRtl ? 'right' : 'left'}:3px solid ${COLORS.gold};padding:18px 22px;border-radius:6px" align="${isRtl ? 'right' : 'left'}">
        <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${escapeHtml(whenLabel)}</p>
        <p style="margin:6px 0 0;font-size:20px;font-weight:600;color:${COLORS.green900}">${escapeHtml(fmtDate)}</p>
        <p style="margin:2px 0 0;font-size:16px;color:${COLORS.ink}" dir="ltr">${escapeHtml(fmtTime)}</p>
        ${opts.room ? `<p style="margin:14px 0 0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${escapeHtml(whereLabel)}</p><p style="margin:4px 0 0;font-size:15px;color:${COLORS.ink}">${escapeHtml(opts.room)}</p>` : ''}
      </td></tr>
    </table>

    <p style="margin:18px 0 0;font-size:15px;color:${COLORS.inkSoft}">${escapeHtml(detail)}</p>
    ${opts.notes ? `<p style="margin:14px 0 0;padding:12px 16px;background:${COLORS.green100};border-radius:6px;font-size:14px;color:${COLORS.green900}"><strong>${escapeHtml(notesLabel)}:</strong> ${escapeHtml(opts.notes)}</p>` : ''}

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 4px"><tr><td>
      <a href="${SITE_URL}/${opts.locale}#courses" style="display:inline-block;padding:14px 28px;background:${COLORS.green800};color:${COLORS.cream};text-decoration:none;border-radius:999px;font-size:14px;font-weight:600">
        ${escapeHtml(ctaText)} →
      </a>
    </td></tr></table>
  `;

  const text = `${s.hello} ${opts.name},

${greeting}.

${whenLabel}: ${fmtDate} ${fmtTime}${opts.room ? `\n${whereLabel}: ${opts.room}` : ''}${opts.notes ? `\n${notesLabel}: ${opts.notes}` : ''}

${detail}

— Rai Language Center
${SITE_URL}`;

  const { error } = await r.emails.send({
    from: FROM,
    to: opts.to,
    subject: title,
    html: frame(body, { locale: opts.locale, preheader, title }),
    text,
  });
  if (error) { console.error('[email] resend error', error); return { ok: false, error }; }
  return { ok: true };
}

/**
 * Email: placement-test result with the recommended books.
 */
export async function sendAssessmentResult(opts: {
  to: string;
  name?: string | null;
  locale: Locale;
  level: string;
  books: string[];
}) {
  const r = resend();
  if (!r) return { ok: false, skipped: true as const };
  const s = strings(opts.locale);
  const isRtl = s.dir === 'rtl';

  const subject = opts.locale === 'ar'
    ? `نتيجة اختبارك — مستواك ${opts.level}`
    : `Your placement result — Level ${opts.level}`;
  const preheader = opts.locale === 'ar'
    ? `وصلتنا نتيجتك. مستواك: ${opts.level}. مع كتب موصى بها.`
    : `Your level is ${opts.level}. Here are your recommended books.`;
  const youAreLabel = opts.locale === 'ar' ? 'مستواك:' : 'Your level:';
  const booksLabel = opts.locale === 'ar' ? 'الكتب الموصى بها' : 'Recommended books';
  const congrats = opts.locale === 'ar' ? 'تهانينا على إكمال اختبار تحديد المستوى!' : 'Congratulations on completing your placement test!';
  const next = opts.locale === 'ar'
    ? 'هذه نقطة انطلاقك. اختر الكتب المناسبة، أو احجز موعداً معنا للحديث عن خطتك الدراسية.'
    : 'This is your starting point. Pick up these books, or book a chat with us to plan the path ahead.';
  const ctaText = opts.locale === 'ar' ? 'احجز موعد تقييم شخصي' : 'Book a personal assessment';

  const body = `
    <p style="margin:0 0 6px;font-size:14px;color:${COLORS.green700};letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(s.hello)}${opts.name ? ' ' + escapeHtml(opts.name) : ''}</p>
    <h1 style="margin:6px 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;color:${COLORS.green900}">${escapeHtml(congrats)}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:${COLORS.inkSoft}">${escapeHtml(next)}</p>

    <!-- Big level number -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 24px">
      <tr><td align="center" style="padding:24px;background:${COLORS.green900};border-radius:12px">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.goldSoft}">${escapeHtml(youAreLabel)}</p>
        <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:64px;line-height:1;color:${COLORS.gold}">${escapeHtml(opts.level)}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${escapeHtml(booksLabel)}</p>
    ${opts.books.length === 0
      ? `<p style="margin:0;font-size:14px;color:${COLORS.inkSoft};font-style:italic">${opts.locale === 'ar' ? 'سنرسل لك توصيات إضافية قريباً.' : 'We will send more recommendations soon.'}</p>`
      : `<ul style="margin:0;padding:0;list-style:none">${opts.books.map((b) => `<li style="margin:0 0 8px;padding:12px 16px;background:${COLORS.ivory};border-radius:6px;font-size:15px;color:${COLORS.ink};border-${isRtl ? 'right' : 'left'}:3px solid ${COLORS.gold}">${escapeHtml(b)}</li>`).join('')}</ul>`
    }

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 4px"><tr><td>
      <a href="${SITE_URL}/${opts.locale}#book" style="display:inline-block;padding:14px 28px;background:${COLORS.gold};color:${COLORS.green900};text-decoration:none;border-radius:999px;font-size:14px;font-weight:600">
        ${escapeHtml(ctaText)} →
      </a>
    </td></tr></table>
  `;

  const text = `${s.hello}${opts.name ? ' ' + opts.name : ''}!

${congrats}

${youAreLabel} ${opts.level}

${booksLabel}:
${opts.books.map((b) => `  • ${b}`).join('\n') || '  (none yet)'}

${next}

— Rai Language Center
${SITE_URL}`;

  const { error } = await r.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html: frame(body, { locale: opts.locale, preheader, title: subject }),
    text,
  });
  if (error) return { ok: false, error };
  return { ok: true };
}

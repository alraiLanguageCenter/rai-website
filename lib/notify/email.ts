import { Resend } from 'resend';

type Locale = 'ar' | 'en';

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM ?? 'Rai Language Center <noreply@railanguagecenter.com>';

export async function sendBookingConfirmation(opts: {
  to: string;
  name: string;
  locale: Locale;
  slot: string; // ISO
  room?: string | null;
  notes?: string | null;
}) {
  const r = resend();
  if (!r) {
    console.warn('[email] Resend not configured — skipping send');
    return { ok: false, skipped: true as const };
  }
  const subject =
    opts.locale === 'ar'
      ? `تأكيد موعد التقييم — مركز الراعي للغات`
      : `Your assessment is confirmed — Rai Language Center`;
  const slotDate = new Date(opts.slot);
  const fmt = new Intl.DateTimeFormat(opts.locale === 'ar' ? 'ar-SY' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(slotDate);
  const dir = opts.locale === 'ar' ? 'rtl' : 'ltr';
  const html = `<!doctype html>
<html lang="${opts.locale}" dir="${dir}">
<body style="margin:0;background:#FBF8F2;font-family:system-ui,-apple-system,sans-serif;color:#0F1B1D">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FBF8F2;padding:40px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px -12px rgba(8,57,34,.18)">
        <tr><td style="background:#0E5132;padding:24px 32px;color:#FBF8F2">
          <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Rai Language Center</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600">${opts.locale === 'ar' ? 'مرحباً ' : 'Hello '}${escapeHtml(opts.name)}</div>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 12px;color:#0E5132;font-size:24px">${opts.locale === 'ar' ? 'تم تأكيد موعدك' : 'Your slot is confirmed'}</h2>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2A3739">
            ${opts.locale === 'ar'
              ? 'يسعدنا تأكيد موعد تقييمك معنا. نرجو الحضور قبل ١٥ دقيقة من الموعد.'
              : "We're pleased to confirm your assessment. Please arrive 15 minutes before your slot."}
          </p>
          <div style="background:#F4ECDA;border-${dir === 'rtl' ? 'right' : 'left'}:3px solid #C9A24A;padding:16px 20px;margin:20px 0;border-radius:6px">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#155A66">${opts.locale === 'ar' ? 'الموعد' : 'When'}</div>
            <div style="margin-top:4px;font-size:18px;font-weight:600">${escapeHtml(fmt)}</div>
            ${opts.room ? `<div style="margin-top:10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#155A66">${opts.locale === 'ar' ? 'القاعة' : 'Room'}</div><div style="margin-top:2px">${escapeHtml(opts.room)}</div>` : ''}
          </div>
          ${opts.notes ? `<p style="margin:16px 0 0;color:#2A3739"><strong>${opts.locale === 'ar' ? 'ملاحظات' : 'Notes'}:</strong> ${escapeHtml(opts.notes)}</p>` : ''}
          <p style="margin:24px 0 0;font-size:14px;color:#2A3739">
            ${opts.locale === 'ar' ? 'إذا أردت تغيير الموعد، تواصل معنا على ' : 'To reschedule, contact us at '}
            <a href="tel:+96317256669">+963 17 256 669</a>.
          </p>
        </td></tr>
        <tr><td style="background:#F4ECDA;padding:16px 32px;font-size:12px;color:#2A3739;text-align:center">
          ${opts.locale === 'ar' ? 'اللاذقية — شارع عمر بن الخطاب' : 'Latakia — Omar Ibn Al-Khattab Street'}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${opts.locale === 'ar' ? 'تم تأكيد موعدك' : 'Your slot is confirmed'}: ${fmt}${opts.room ? ` — ${opts.locale === 'ar' ? 'القاعة' : 'Room'} ${opts.room}` : ''}`;

  const { error } = await r.emails.send({
    from: FROM, to: opts.to, subject, html, text,
  });
  if (error) {
    console.error('[email] resend error', error);
    return { ok: false, error };
  }
  return { ok: true };
}

export async function sendAssessmentResult(opts: {
  to: string;
  name?: string | null;
  locale: Locale;
  level: string;
  books: string[];
}) {
  const r = resend();
  if (!r) return { ok: false, skipped: true as const };
  const subject = opts.locale === 'ar'
    ? `نتيجة اختبار تحديد المستوى — مستواك: ${opts.level}`
    : `Your placement result — Level ${opts.level}`;
  const html = `<!doctype html>
<html lang="${opts.locale}" dir="${opts.locale === 'ar' ? 'rtl' : 'ltr'}">
<body style="margin:0;background:#FBF8F2;font-family:system-ui,sans-serif;color:#0F1B1D">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden">
    <div style="background:#0E5132;padding:24px 32px;color:#FBF8F2">
      <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Rai Language Center</div>
      <div style="margin-top:6px;font-size:22px;font-weight:600">${opts.locale === 'ar' ? 'مرحباً' : 'Hello'}${opts.name ? ' ' + escapeHtml(opts.name) : ''}</div>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0;color:#0E5132">${opts.locale === 'ar' ? 'مستواك:' : 'Your level:'}</h2>
      <div style="margin-top:8px;font-size:64px;font-weight:700;color:#C9A24A">${escapeHtml(opts.level)}</div>
      <h3 style="margin-top:24px;color:#0E5132">${opts.locale === 'ar' ? 'الكتب الموصى بها' : 'Recommended books'}</h3>
      <ul style="margin-top:8px;padding-${opts.locale === 'ar' ? 'right' : 'left'}:20px;color:#2A3739;line-height:1.7">
        ${opts.books.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </div>
  </div>
</body></html>`;
  const { error } = await r.emails.send({ from: FROM, to: opts.to, subject, html });
  return error ? { ok: false, error } : { ok: true };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

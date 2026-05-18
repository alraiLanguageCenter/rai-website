type Locale = 'ar' | 'en';

/**
 * WhatsApp Cloud API (Meta) — sends a free-text service message.
 * Requires env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID.
 * For template messages (outside 24-hour service window) you must use the templates endpoint;
 * v1 uses a 24-hour-window text after the booking is created (since user provided their number).
 */
export async function sendBookingWhatsApp(opts: {
  toPhoneE164: string; // e.g. +96396646699
  name: string;
  locale: Locale;
  slotISO: string;
  room?: string | null;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.warn('[whatsapp] not configured — skipping');
    return { ok: false, skipped: true as const };
  }
  const to = opts.toPhoneE164.replace(/[^\d]/g, '');
  const slot = new Intl.DateTimeFormat(opts.locale === 'ar' ? 'ar-SY' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(opts.slotISO));

  const body =
    opts.locale === 'ar'
      ? `مرحباً ${opts.name} 👋\n\nتم تأكيد موعد تقييمك في مركز الراعي للغات:\n📅 ${slot}${opts.room ? `\n📍 القاعة ${opts.room}` : ''}\n\nيرجى الحضور قبل ١٥ دقيقة. للتعديل: +963 17 2566699`
      : `Hello ${opts.name} 👋\n\nYour assessment at Rai Language Center is confirmed:\n📅 ${slot}${opts.room ? `\n📍 Room ${opts.room}` : ''}\n\nPlease arrive 15 minutes early. To reschedule: +963 17 2566699`;

  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[whatsapp] send failed', res.status, text);
    return { ok: false, status: res.status, error: text };
  }
  const json = await res.json().catch(() => ({}));
  return { ok: true, response: json };
}

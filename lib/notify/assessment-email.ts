import { Resend } from 'resend';
import type { AnalysisOutput } from '@/lib/assessment/analysis';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const FROM = process.env.RESEND_FROM ?? 'Rai Language Center <onboarding@resend.dev>';
const ADMIN_INBOX = process.env.ADMIN_INBOX ?? 'railanguagecenter@gmail.com';

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
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/**
 * Branded AI-assessment report email. Sent to candidate AND BCC'd to railanguagecenter@gmail.com.
 */
export async function sendAssessmentReport(opts: {
  to: string;
  name: string;
  locale: 'ar' | 'en';
  analysis: AnalysisOutput;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[assessment-email] Resend not configured — skipping send');
    return { ok: false, skipped: true as const };
  }
  const resend = new Resend(key);

  const isAr = opts.locale === 'ar';
  const a = opts.analysis;

  const subject = isAr
    ? `تقرير التقييم الذكي — ${opts.name} (المستوى ${a.level})`
    : `AI Assessment Report — ${opts.name} (Level ${a.level})`;

  const preheader = isAr
    ? `وصلتك نتيجتك الكاملة بتحليل الذكاء الاصطناعي. مستواك: ${a.level}.`
    : `Your full AI-graded report is ready. Level: ${a.level}.`;

  // -- Header --
  const header = `
  <tr><td style="background:${COLORS.green800};padding:28px 36px;color:${COLORS.cream}" align="${isAr ? 'right' : 'left'}">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
      <td valign="middle" align="${isAr ? 'right' : 'left'}">
        <img src="${SITE_URL}/brand/rlc-logo-transparent.png" width="56" height="56" alt="RLC" style="display:inline-block;vertical-align:middle;border:0;outline:none;text-decoration:none" />
        <span style="display:inline-block;vertical-align:middle;${isAr ? 'margin-right' : 'margin-left'}:14px">
          <span style="display:block;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7">Rai Language Center</span>
          <span style="display:block;margin-top:4px;font-size:13px;font-style:italic;color:${COLORS.gold}">${isAr ? 'تعلّم. تواصل. انجح.' : 'Learn. Connect. Succeed.'}</span>
        </span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldSoft} 50%, ${COLORS.gold} 100%);line-height:3px;font-size:0">&nbsp;</td></tr>`;

  // -- Greeting --
  const greeting = `
    <p style="margin:0 0 6px;font-size:14px;color:${COLORS.green700};letter-spacing:0.18em;text-transform:uppercase">${isAr ? 'تقريرك بالذكاء الاصطناعي' : 'Your AI Report'}</p>
    <h1 style="margin:6px 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;color:${COLORS.green900}">${isAr ? 'مرحباً ' : 'Hello '}${escapeHtml(opts.name)},</h1>
    <p style="margin:0 0 22px;font-size:16px;color:${COLORS.inkSoft};line-height:1.65">${escapeHtml(a.summary)}</p>`;

  // -- Level + score block --
  const levelBlock = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0 28px">
      <tr><td align="center" style="padding:22px;background:${COLORS.green900};border-radius:12px">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.goldSoft}">${isAr ? 'مستواك' : 'Your CEFR Level'}</p>
        <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:64px;line-height:1;color:${COLORS.gold}">${escapeHtml(a.level)}</p>
        <p style="margin:10px 0 0;color:${COLORS.cream};font-size:14px;opacity:0.85">${a.score} / ${a.total} ${isAr ? 'نقطة' : 'points'}</p>
      </td></tr>
    </table>`;

  // -- Radar chart (inline SVG inside HTML) --
  const radarBlock = `
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${isAr ? 'خريطة المهارات' : 'Skills diagram'}</p>
    <div style="background:${COLORS.ivory};border-radius:10px;padding:14px;margin:8px 0 24px;text-align:center">
      ${a.radarSvg}
    </div>`;

  // -- Per-competency analysis --
  const competencyBlock = `
    <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${isAr ? 'تحليل المهارات الأربع' : 'Four-skill analysis'}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px">
      ${a.competencies
        .map(
          (c) => `<tr><td style="padding:12px 16px;background:${COLORS.ivory};border-${isAr ? 'right' : 'left'}:3px solid ${COLORS.gold};border-radius:6px;margin-bottom:10px;display:block">
            <p style="margin:0;font-weight:600;color:${COLORS.green900};font-size:15px">${escapeHtml(c.label)} — ${escapeHtml(String(a.skills.find((s) => s.skill === c.skill)?.pct ?? 0))}%</p>
            <p style="margin:6px 0 0;color:${COLORS.inkSoft};font-size:14px;line-height:1.55">${escapeHtml(c.analysis)}</p>
            <p style="margin:6px 0 0;color:${COLORS.green700};font-size:13px;font-style:italic">${isAr ? 'التوصية:' : 'Recommendation:'} ${escapeHtml(c.recommendation)}</p>
          </td></tr>
          <tr><td style="height:10px;line-height:10px;font-size:0">&nbsp;</td></tr>`,
        )
        .join('')}
    </table>`;

  // -- Recommended course --
  const courseBlock = `
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${isAr ? 'الدورة الموصى بها' : 'Recommended course'}</p>
    <div style="background:${COLORS.green100};border-radius:10px;padding:18px 22px;margin:0 0 24px">
      <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:600;color:${COLORS.green900}">${escapeHtml(a.recommendedCourse.title)}</p>
      <p style="margin:8px 0 0;color:${COLORS.inkSoft};font-size:14px;line-height:1.55">${escapeHtml(a.recommendedCourse.why)}</p>
      <p style="margin:14px 0 0">
        <a href="${SITE_URL}/${opts.locale}#book" style="display:inline-block;padding:10px 22px;background:${COLORS.green800};color:${COLORS.cream};text-decoration:none;border-radius:999px;font-size:13px;font-weight:600">${isAr ? 'احجز موعد تقييم' : 'Book a session'}</a>
      </p>
    </div>`;

  // -- 12-week study plan --
  const planBlock = `
    <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.green700}">${isAr ? 'خطة دراسية لـ ١٢ أسبوعاً' : '12-week study plan'}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px">
      ${a.studyPlan
        .map(
          (w) => `<tr><td style="padding:14px 16px;background:${COLORS.cream};border:1px solid ${COLORS.goldSoft};border-radius:6px;display:block">
            <p style="margin:0;font-family:Georgia,serif;font-weight:600;color:${COLORS.green900};font-size:14px">${escapeHtml(w.week)}</p>
            <p style="margin:6px 0 0;color:${COLORS.inkSoft};font-size:13px">${escapeHtml(w.focus)}</p>
            <ul style="margin:8px 0 0;padding-${isAr ? 'right' : 'left'}:18px;color:${COLORS.inkSoft};font-size:13px;line-height:1.6">
              ${w.activities.map((act) => `<li>${escapeHtml(act)}</li>`).join('')}
            </ul>
          </td></tr>
          <tr><td style="height:8px;line-height:8px;font-size:0">&nbsp;</td></tr>`,
        )
        .join('')}
    </table>`;

  // -- Footer --
  const footer = `
    <tr><td style="background:${COLORS.ivory};padding:24px 36px;border-top:1px solid rgba(15,27,29,0.08)" align="${isAr ? 'right' : 'left'}">
      <p style="margin:0 0 10px;font-size:13px;color:${COLORS.inkSoft}">
        ${isAr ? 'اللاذقية — شارع عمر بن الخطاب' : 'Latakia — Omar Ibn Al-Khattab Street'}<br />
        <a href="tel:+96317256669" style="color:${COLORS.green800};text-decoration:none">+963 17 256 669</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:${COLORS.green800};text-decoration:none">${isAr ? 'زر الموقع' : 'Visit website'}</a>
      </p>
      <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.inkSoft};opacity:0.6">
        © ${new Date().getFullYear()} Rai Language Center · ${isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
      </p>
    </td></tr>`;

  const html = `<!doctype html>
<html lang="${opts.locale}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.ink};line-height:1.55;-webkit-font-smoothing:antialiased">
  <span style="display:none !important;color:transparent;visibility:hidden;opacity:0;height:0;width:0;font-size:0;overflow:hidden">${escapeHtml(preheader)}</span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COLORS.cream};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width:640px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px -20px rgba(8,57,34,0.20)">
        ${header}
        <tr><td style="padding:36px 36px 28px" align="${isAr ? 'right' : 'left'}">
          ${greeting}
          ${levelBlock}
          ${radarBlock}
          ${competencyBlock}
          ${courseBlock}
          ${planBlock}
        </td></tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${opts.name},

${a.summary}

Level: ${a.level}
Score: ${a.score}/${a.total}

Per-skill:
${a.skills.map((s) => `  ${s.skill}: ${s.correct}/${s.total} (${s.pct}%)`).join('\n')}

Recommended course: ${a.recommendedCourse.title}
${a.recommendedCourse.why}

— Rai Language Center
${SITE_URL}`;

  // The report goes ONLY to the center inbox (admin) for review.
  // The candidate's contact info is in the subject line + first paragraph of
  // the email so admin can follow up directly.
  const adminSubject = `AI Assessment Report — ${opts.name} (${a.level}) · ${opts.to}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_INBOX,
    replyTo: opts.to || undefined,
    subject: adminSubject,
    html,
    text,
  });

  if (error) {
    console.error('[assessment-email] admin send failed', error);
    return { ok: false, error };
  }
  return { ok: true };
}

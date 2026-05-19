import { Fraunces, Inter, Noto_Kufi_Arabic } from 'next/font/google';

/**
 * English display face — serif used for headlines.
 */
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/**
 * English body face.
 */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
});

/**
 * Arabic — Noto Kufi Arabic.
 *
 * A professional, elegant Kufi face with full Arabic shaping, punctuation,
 * diacritics (tashkeel), and ligature support, plus extended Arabic ranges.
 * Used for both Arabic headlines AND body so the entire AR site speaks one
 * voice. The font is self-hosted by Next.js (next/font/google) for best
 * performance, no FOUT, and no @import-based render-blocking request.
 *
 * Weights cover regular through bold so headlines, buttons, and chips all
 * have the right emphasis. Fallbacks are declared in globals.css:
 *   Cairo → Tajawal → IBM Plex Sans Arabic → Segoe UI Arabic → system-ui
 *   → Arial → sans-serif.
 */
export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const fontClassNames = [
  fraunces.variable,
  inter.variable,
  notoKufiArabic.variable,
].join(' ');

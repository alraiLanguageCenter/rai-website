import { Fraunces, Inter, Marhey, IBM_Plex_Sans_Arabic } from 'next/font/google';

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const marhey = Marhey({
  subsets: ['arabic', 'latin'],
  variable: '--font-marhey',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  variable: '--font-plex-arabic',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const fontClassNames = [
  fraunces.variable,
  inter.variable,
  marhey.variable,
  plexArabic.variable,
].join(' ');

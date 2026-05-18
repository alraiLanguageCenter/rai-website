import { NextIntlClientProvider } from 'next-intl';
import { fontClassNames } from '@/lib/fonts';
import en from '@/messages/en.json';
import '../globals.css';

export const metadata = { title: 'Admin · Rai Language Center' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontClassNames}>
      <body className="min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
        <NextIntlClientProvider locale="en" messages={en}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

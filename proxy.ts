import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude every route that has its own structure outside [locale]/:
  // - api: server routes
  // - admin / teacher / student: portal routes (locale-agnostic)
  // - register: standalone public registration form (no locale prefix so the
  //   QR code URL is short and stable)
  matcher: ['/((?!api|admin|teacher|student|register|_next|_vercel|.*\\..*).*)'],
};

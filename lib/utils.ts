import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert ASCII digits (0–9) inside a string to Arabic-Indic digits (٠–٩).
 * Used when rendering phone numbers, page numbers, dates, etc. in the AR
 * locale so the entire UI reads in Arabic. Non-digit characters (+, spaces,
 * letters) are left untouched, so "+963 17 256 6699" → "+٩٦٣ ١٧ ٢٥٦ ٦٦٩٩".
 */
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;
export function toArabicDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/**
 * Locale-aware digit formatter. Pass the active locale; English keeps the
 * ASCII digits, Arabic gets them converted in-place.
 */
export function formatDigits(value: string | number, locale: 'ar' | 'en'): string {
  return locale === 'ar' ? toArabicDigits(value) : String(value);
}

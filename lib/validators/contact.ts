import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  course: z.enum(['kids', 'adults', 'exams', 'business', 'other']),
  message: z.string().min(10),
  locale: z.enum(['ar', 'en']),
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

import { z } from 'zod';

export const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  ageGroup: z.enum(['child', 'teen', 'adult', 'professional']),
  preferredSlots: z.array(z.string().datetime()).min(1).max(3),
  notes: z.string().max(2000).optional().or(z.literal('')),
  locale: z.enum(['ar', 'en']),
  website: z.string().max(0).optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;

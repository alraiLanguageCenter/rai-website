import { z } from 'zod';

export const assessmentSubmitSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  name: z.string().optional().or(z.literal('')),
  ageGroup: z.enum(['child', 'teen', 'adult', 'professional']).optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedIndex: z.number().int().min(0).max(10),
    correct: z.boolean(),
    skillTag: z.string().optional(),
  })).min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  score: z.number().int().min(0),
  locale: z.enum(['ar', 'en']),
});
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>;

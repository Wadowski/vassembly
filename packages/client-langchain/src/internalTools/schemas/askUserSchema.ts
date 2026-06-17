import { z } from 'zod';

const questionInputSchema = z.object({
  question: z.string().min(1),
  input_type: z.enum(['text', 'select', 'multiselect', 'boolean']).optional(),
  options: z.array(z.string()).optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
});

export const askUserSchema = z.object({
  question: z.string().min(1).optional(),
  input_type: z.enum(['text', 'select', 'multiselect', 'boolean']).optional(),
  options: z.array(z.string()).optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
  questions: z.array(questionInputSchema).min(1).optional(),
});

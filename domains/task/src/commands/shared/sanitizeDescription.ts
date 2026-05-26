import { z } from 'zod';

export const descriptionSchema = z
  .string()
  .trim()
  .max(5000, 'Description cannot exceed 5000 characters')
  .transform((value) => value.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ''))
  .pipe(z.string().min(1, 'Description cannot be empty'));

export const sanitizeDescription = (input: string): string => descriptionSchema.parse(input);

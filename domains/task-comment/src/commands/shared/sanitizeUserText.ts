import { z } from 'zod';

export const TASK_COMMENT_USER_TEXT_SCHEMA = z
  .string()
  .trim()
  .min(1, 'Comment text is required');

export const sanitizeUserText = (value: string): string => {
  const parsed = TASK_COMMENT_USER_TEXT_SCHEMA.safeParse(value);

  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
};

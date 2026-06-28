import { z } from 'zod';

export const webPageContentSchema = z.object({
  url: z.string().url(),
});

import { z } from 'zod';

export const errorResponseSchema = z.object({
  type: z.string(),
  message: z.string(),
  error: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const withErrorResponses = (
  successSchema: z.ZodTypeAny,
  statusCode: number = 200,
): Record<number, z.ZodTypeAny> => ({
  [statusCode]: successSchema,
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  429: errorResponseSchema,
  500: errorResponseSchema,
});

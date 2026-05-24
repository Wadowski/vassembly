import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { FORM_LIMITS, type AiIntegrationFormInput } from '@vassembly/ui-api-hooks';

export const createAiIntegrationFormSchema = (
  mode: 'create' | 'edit',
): z.ZodType<AiIntegrationFormInput> =>
  z
    .object({
      name: z.string().min(1, 'Name is required').max(FORM_LIMITS.nameMaxLength),
      provider: z.enum(['gemini', 'chatgpt', 'lm_studio']),
      apiKey: z.string().max(FORM_LIMITS.apiKeyMaxLength),
      baseUrl: z
        .union([z.string().url('Invalid URL').max(FORM_LIMITS.baseUrlMaxLength), z.literal(''), z.null()])
        .optional(),
      organizationId: z
        .string()
        .max(FORM_LIMITS.organizationIdMaxLength)
        .optional()
        .nullable(),
      model: z.string().min(1, 'Model is required').max(FORM_LIMITS.modelMaxLength),
    })
    .superRefine((data, ctx) => {
      const requiresApiKey = mode === 'create' && (data.provider === 'gemini' || data.provider === 'chatgpt');

      if (requiresApiKey && data.apiKey.trim() === '') {
        ctx.addIssue({ code: 'custom', message: 'API key is required', path: ['apiKey'] });
      }

      if (
        data.provider === 'lm_studio' &&
        (data.baseUrl === null || data.baseUrl === undefined || data.baseUrl.trim() === '')
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Base URL is required for LM Studio',
          path: ['baseUrl'],
        });
      }
    });

export const createValidateAiIntegrationForm = (mode: 'create' | 'edit') =>
  validatorFactory(createAiIntegrationFormSchema(mode));

export const toAiIntegrationFormValues = (initial?: Partial<AiIntegrationFormInput>): AiIntegrationFormInput => ({
  name: initial?.name ?? '',
  provider: initial?.provider ?? 'gemini',
  apiKey: initial?.apiKey ?? '',
  baseUrl: initial?.baseUrl ?? null,
  organizationId: initial?.organizationId ?? null,
  model: initial?.model ?? '',
});

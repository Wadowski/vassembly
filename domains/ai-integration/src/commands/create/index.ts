import { createDb } from '@vassembly/commands';
import { encode } from '@vassembly/client-encoder';
import { z } from 'zod';

import {
  AiIntegrationConnectionStatus,
  AiIntegrationProvider,
  AiIntegrationStatus,
} from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { AiIntegrationCredentialModel, aiIntegrationCredentialFactory } from '../../model';

import type { CreateAiIntegrationCommandInput } from './types';
import type { AiIntegrationProviderValue } from '../../types';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

const CREATE_SCHEMA = z
  .object({
    userId: z.string().min(1),
    name: z.string().min(1).max(100),
    provider: z.enum(PROVIDER_VALUES),
    encryptedApiKey: z.string().optional(),
    baseUrl: z.string().url().nullable().optional(),
    organizationId: z.string().nullable().optional(),
    status: z.enum(Object.values(AiIntegrationStatus) as [string, ...string[]]),
    connectionStatus: z.enum(Object.values(AiIntegrationConnectionStatus) as [string, ...string[]]),
    lastTestedAt: z.null().optional(),
    lastConnectionError: z.null().optional(),
    removedAt: z.null().default(null),
  })
  .superRefine((data, ctx) => {
    if (data.provider === AiIntegrationProvider.Gemini && !data.encryptedApiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for gemini', path: ['encryptedApiKey'] });
    }
    if (data.provider === AiIntegrationProvider.ChatGpt && !data.encryptedApiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for chatgpt', path: ['encryptedApiKey'] });
    }
    if (data.provider === AiIntegrationProvider.LmStudio && !data.baseUrl?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'baseUrl is required for lm_studio', path: ['baseUrl'] });
    }
  });

const createDbCredential = createDb<AiIntegrationCredentialModel>({
  dao: aiIntegrationMongodbDao,
  factory: aiIntegrationCredentialFactory,
  validationSchema: CREATE_SCHEMA,
});

const toCreatePayload = (input: CreateAiIntegrationCommandInput) => ({
  userId: input.userId,
  name: input.name,
  provider: input.provider as AiIntegrationProviderValue,
  encryptedApiKey: input.apiKey?.trim() ? encode(input.apiKey.trim()) : undefined,
  baseUrl: input.baseUrl,
  organizationId: input.organizationId,
  status: AiIntegrationStatus.Active,
  connectionStatus: AiIntegrationConnectionStatus.Untested,
  lastTestedAt: undefined,
  lastConnectionError: undefined,
  removedAt: undefined,
});

export const create = (input: CreateAiIntegrationCommandInput) =>
  createDbCredential(toCreatePayload(input));

import { updateDbById } from '@vassembly/commands';
import { encode } from '@vassembly/client-encoder';
import { z } from 'zod';

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { AiIntegrationCredentialModel, aiIntegrationCredentialFactory } from '../../model';
import { getById } from '../../queries';

import type { UpdateAiIntegrationCommandInput } from './types';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

const UPDATE_DB_SCHEMA = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.enum(PROVIDER_VALUES).optional(),
  encryptedApiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  organizationId: z.string().optional(),
  status: z.enum(Object.values(AiIntegrationStatus) as [string, ...string[]]).optional(),
  connectionStatus: z.enum(Object.values(AiIntegrationConnectionStatus) as [string, ...string[]]).optional(),
  lastTestedAt: z.date().optional(),
  lastConnectionError: z.string().optional(),
});

const persistUpdate = updateDbById<AiIntegrationCredentialModel>({
  dao: aiIntegrationMongodbDao,
  factory: aiIntegrationCredentialFactory,
  validationSchema: UPDATE_DB_SCHEMA,
});

const shouldResetConnectionStatus = ({
  existing,
  data,
}: {
  existing: AiIntegrationCredentialModel;
  data: UpdateAiIntegrationCommandInput['data'];
}): boolean => {
  if (data.apiKey !== undefined) {
    return true;
  }
  if (data.baseUrl !== undefined && data.baseUrl !== existing.baseUrl) {
    return true;
  }
  if (data.organizationId !== undefined && data.organizationId !== existing.organizationId) {
    return true;
  }
  return false;
};

export const update = async (input: UpdateAiIntegrationCommandInput) => {
  const existingResult = await getById({ id: input.id, userId: input.userId });
  const existing = existingResult.data;
  const { apiKey, ...restData } = input.data;
  const updateData: Record<string, unknown> = { ...restData };

  if (apiKey !== undefined) {
    updateData.encryptedApiKey = apiKey.trim() ? encode(apiKey.trim()) : undefined;
  }

  if (shouldResetConnectionStatus({ existing, data: input.data })) {
    updateData.connectionStatus = AiIntegrationConnectionStatus.Untested;
  }

  return persistUpdate({ id: input.id, data: updateData });
};

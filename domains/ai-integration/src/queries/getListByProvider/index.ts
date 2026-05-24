import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';
import type { AiIntegrationCredentialModel } from '../../model';

import type { GetListByProviderQueryInput, GetListByProviderQueryResult } from './types';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  provider: z.enum(PROVIDER_VALUES),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

export const getListByProvider = async (
  input: GetListByProviderQueryInput,
): Promise<GetListByProviderQueryResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const filter = {
    userId: parsed.data.userId,
    provider: parsed.data.provider,
    status: AiIntegrationStatus.Active,
    connectionStatus: AiIntegrationConnectionStatus.Connected,
    $or: [{ removedAt: null }, { removedAt: { $exists: false } }],
  };

  const rows = await aiIntegrationMongodbDao.getManyRaw(filter, {
    sort: { createdAt: -1 },
  });
  const items = rows.map((row) => aiIntegrationCredentialFactory.create(row as Partial<AiIntegrationCredentialModel>));

  return { items };
};

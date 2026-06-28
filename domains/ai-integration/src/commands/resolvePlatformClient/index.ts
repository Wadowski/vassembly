import { config } from '@vassembly/config';

import { getModeledProviderClient } from '../../clients';
import { AiIntegrationProvider } from '../../constants';

import type { ResolvePlatformClientResult } from './types';

const PLATFORM_INTEGRATION_NAME = 'Platform AI';

export const resolvePlatformClient = async (): Promise<ResolvePlatformClientResult> => {
  const { provider, apiKey, baseUrl, defaultModel, organizationId } = config.platformAi;

  const resolvedApiKey =
    provider === AiIntegrationProvider.LmStudio ? apiKey || undefined : apiKey;

  const client = getModeledProviderClient({
    provider,
    apiKey: resolvedApiKey,
    baseUrl: baseUrl || undefined,
    organizationId: organizationId || undefined,
    model: defaultModel,
  });

  return {
    client,
    integrationSnapshot: {
      integrationName: PLATFORM_INTEGRATION_NAME,
      provider,
      model: defaultModel,
    },
  };
};

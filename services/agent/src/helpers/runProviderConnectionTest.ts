import { createProviderClient } from '@vassembly/client-langchain';

import type { AiProviderTestResult } from '@vassembly/client-langchain';

interface RunProviderConnectionTestParams {
  provider: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export const runProviderConnectionTest = async (
  params: RunProviderConnectionTestParams,
): Promise<AiProviderTestResult> => {
  const client = createProviderClient(params);
  return client.testConnection();
};

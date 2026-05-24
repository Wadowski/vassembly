import { mapConnectionTestError } from './mapConnectionTestError';
import { runProviderConnectionTest } from './runProviderConnectionTest';

import type { AiProviderTestResult } from '@vassembly/client-langchain';

interface AssertProviderConnectionParams {
  provider: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export const assertProviderConnection = async (
  params: AssertProviderConnectionParams,
): Promise<AiProviderTestResult> => {
  const result = await runProviderConnectionTest(params);
  if (!result.success) {
    mapConnectionTestError({ error: result.error, mode: 'blockSave' });
  }
  return result;
};

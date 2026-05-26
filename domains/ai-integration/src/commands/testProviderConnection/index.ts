import { getProviderClient } from "../../clients";
import type { AiProviderTestResult } from "../../clients";

export interface TestProviderConnectionParams {
  provider: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export const testProviderConnection = async (
  params: TestProviderConnectionParams,
): Promise<AiProviderTestResult> => {
  const client = getProviderClient(params);
  return client.testConnection();
};

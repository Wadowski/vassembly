import { createProviderClient } from "@vassembly/client-langchain";

import type {
  AiProviderClient,
  AiProviderTestResult,
  CreateProviderClientParams,
} from "@vassembly/client-langchain";

export const getProviderClient = (
  params: CreateProviderClientParams,
): AiProviderClient => createProviderClient(params);

export interface ModeledProviderClient {
  invoke(message: string): Promise<{ message: string }>;
}

export const getModeledProviderClient = (
  params: CreateProviderClientParams & { model: string },
): ModeledProviderClient => {
  const client = createProviderClient(params);
  const model = params.model;

  return {
    invoke: (message: string) => client.invoke({ model, message }),
  };
};

export type { AiProviderClient, AiProviderTestResult, CreateProviderClientParams };

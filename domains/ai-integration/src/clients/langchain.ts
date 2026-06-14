import { createProviderClient } from '@vassembly/client-langchain';

import type {
  AiProviderClient,
  AiProviderInvokeParams,
  AiProviderTestResult,
  CreateProviderClientParams,
} from '@vassembly/client-langchain';

export const getProviderClient = (
  params: CreateProviderClientParams,
): AiProviderClient => createProviderClient(params);

export interface ModeledProviderInvokeParams {
  message: string;
  systemMessage?: string;
  mcpServerConfigs?: AiProviderInvokeParams['mcpServerConfigs'];
}

export interface ModeledProviderClient {
  invoke(params: ModeledProviderInvokeParams | string): Promise<{ message: string }>;
}

export const getModeledProviderClient = (
  params: CreateProviderClientParams & { model: string },
): ModeledProviderClient => {
  const client = createProviderClient(params);
  const model = params.model;

  return {
    invoke: (messageOrParams: ModeledProviderInvokeParams | string) => {
      if (typeof messageOrParams === 'string') {
        return client.invoke({ model, message: messageOrParams });
      }

      return client.invoke({
        model,
        message: messageOrParams.message,
        systemMessage: messageOrParams.systemMessage,
        mcpServerConfigs: messageOrParams.mcpServerConfigs,
      });
    },
  };
};

export type { AiProviderClient, AiProviderTestResult, CreateProviderClientParams };

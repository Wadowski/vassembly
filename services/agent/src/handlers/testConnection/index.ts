import { decode } from '@vassembly/client-encoder';
import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import { ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { mapConnectionTestError } from '../../helpers/mapConnectionTestError';
import { runProviderConnectionTest } from '../../helpers/runProviderConnectionTest';

import { TEST_CONNECTION_BODY_SCHEMA } from './types';

import type { TestConnectionHandlerInput, TestConnectionHandlerOutput } from './types';

const validateTestConnectionBody = validatorFactory(TEST_CONNECTION_BODY_SCHEMA);

const buildSuccessOutput = (models?: string[]): TestConnectionHandlerOutput => ({
  success: true,
  connectionStatus: AiIntegrationConnectionStatus.Connected,
  models,
});

const testEphemeralConnection = async (
  input: TestConnectionHandlerInput,
): Promise<TestConnectionHandlerOutput> => {
  const { body } = input;
  const result = await runProviderConnectionTest({
    provider: body.provider ?? '',
    apiKey: body.apiKey,
    baseUrl: body.baseUrl,
    organizationId: body.organizationId,
  });

  if (!result.success) {
    mapConnectionTestError({ error: result.error, mode: 'ephemeral' });
  }

  return buildSuccessOutput(result.models);
};

const testSavedConnection = async (
  input: TestConnectionHandlerInput,
): Promise<TestConnectionHandlerOutput> => {
  const { body, userId } = input;
  const credentialId = body.credentialId;

  if (!userId || !credentialId) {
    throw new ValidationError('userId and credentialId are required for saved credential test');
  }

  const credentialResult = await aiIntegrationDomain.queries.getById({
    id: credentialId,
    userId,
  });
  const credential = credentialResult.data;
  const apiKey = credential.encryptedApiKey ? decode(credential.encryptedApiKey) : undefined;

  const result = await runProviderConnectionTest({
    provider: credential.provider ?? '',
    apiKey,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
  });

  await aiIntegrationDomain.commands.update({
    id: credentialId,
    userId,
    data: {
      connectionStatus: result.success
        ? AiIntegrationConnectionStatus.Connected
        : AiIntegrationConnectionStatus.Failed,
      lastTestedAt: new Date(),
      lastConnectionError: result.success ? null : (result.error ?? 'Connection test failed'),
    },
  });

  if (!result.success) {
    mapConnectionTestError({ error: result.error, mode: 'saved' });
  }

  return buildSuccessOutput(result.models);
};

export const testConnection = async (
  input: TestConnectionHandlerInput,
): Promise<TestConnectionHandlerOutput> => {
  const parsedResult = validateTestConnectionBody(input.body);
  if (!parsedResult.success) {
    throw parsedResult.error;
  }

  if (parsedResult.data.credentialId) {
    return testSavedConnection({ ...input, body: parsedResult.data });
  }

  return testEphemeralConnection({ ...input, body: parsedResult.data });
};

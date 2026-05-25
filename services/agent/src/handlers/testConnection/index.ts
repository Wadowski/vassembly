import { decode } from '@vassembly/client-encoder';
import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import { ValidationError, WrongParamError, InternalError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

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
  try {
    const result = await aiIntegrationDomain.commands.testProviderConnection({
      provider: body.provider ?? '',
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      organizationId: body.organizationId,
    });

    return buildSuccessOutput(result.models);
  } catch (error) {
    if (error instanceof WrongParamError || error instanceof InternalError) {
      throw error;
    }
    throw new InternalError('Connection test failed');
  }
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

  try {
    const result = await aiIntegrationDomain.commands.testProviderConnection({
      provider: credential.provider ?? '',
      apiKey,
      baseUrl: credential.baseUrl,
      organizationId: credential.organizationId,
    });

    await aiIntegrationDomain.commands.update({
      id: credentialId,
      userId,
      data: {
        connectionStatus: AiIntegrationConnectionStatus.Connected,
        lastTestedAt: new Date(),
      },
    });

    return buildSuccessOutput(result.models);
  } catch (error) {
    await aiIntegrationDomain.commands.update({
      id: credentialId,
      userId,
      data: {
        connectionStatus: AiIntegrationConnectionStatus.Failed,
        lastTestedAt: new Date(),
      },
    });

    if (error instanceof WrongParamError || error instanceof InternalError) {
      throw error;
    }
    throw new InternalError('Connection test failed');
  }
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

import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import { ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { assertProviderConnection } from '../../helpers/assertProviderConnection';
import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import { CREATE_CREDENTIAL_BODY_SCHEMA } from './types';

import type { CreateCredentialHandlerInput, CreateCredentialHandlerOutput } from './types';

const validateCreateCredentialBody = validatorFactory(CREATE_CREDENTIAL_BODY_SCHEMA);

export const createCredential = async (
  input: CreateCredentialHandlerInput,
): Promise<CreateCredentialHandlerOutput> => {
  const parsedResult = validateCreateCredentialBody(input.body);
  if (!parsedResult.success) {
    throw parsedResult.error;
  }
  const parsed = parsedResult.data;

  await assertProviderConnection({
    provider: parsed.provider,
    apiKey: parsed.apiKey,
    baseUrl: parsed.baseUrl,
    organizationId: parsed.organizationId,
  });

  const createResult = await aiIntegrationDomain.commands.create({
    userId: input.userId,
    name: parsed.name,
    provider: parsed.provider,
    apiKey: parsed.apiKey,
    baseUrl: parsed.baseUrl,
    organizationId: parsed.organizationId,
  });

  const credentialId = createResult.data.id;
  if (!credentialId) {
    throw new ValidationError('Failed to create credential');
  }

  const updateResult = await aiIntegrationDomain.commands.update({
    id: credentialId,
    userId: input.userId,
    data: {
      connectionStatus: AiIntegrationConnectionStatus.Connected,
      lastTestedAt: new Date(),
      lastConnectionError: null,
    },
  });

  const credential = await enrichCredentialResponse({ credential: updateResult.data });
  return { credential };
};

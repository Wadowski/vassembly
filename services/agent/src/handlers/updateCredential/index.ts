import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import { validatorFactory } from '@vassembly/validation';

import { assertProviderConnection } from '../../helpers/assertProviderConnection';
import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import { resolveApiKeyForTest, shouldRetestConnection } from './helpers';
import { UPDATE_CREDENTIAL_BODY_SCHEMA } from './types';

import type { UpdateCredentialHandlerInput, UpdateCredentialHandlerOutput } from './types';

const validateUpdateCredentialBody = validatorFactory(UPDATE_CREDENTIAL_BODY_SCHEMA);

export const updateCredential = async (
  input: UpdateCredentialHandlerInput,
): Promise<UpdateCredentialHandlerOutput> => {
  const parsedResult = validateUpdateCredentialBody(input.body);
  if (!parsedResult.success) {
    throw parsedResult.error;
  }
  const parsed = parsedResult.data;

  const existingResult = await aiIntegrationDomain.queries.getById({
    id: input.credentialId,
    userId: input.userId,
  });
  const existing = existingResult.data;
  const needsRetest = shouldRetestConnection({ existing, body: parsed });

  if (needsRetest) {
    await assertProviderConnection({
      provider: existing.provider ?? '',
      apiKey: resolveApiKeyForTest({
        bodyApiKey: parsed.apiKey,
        existingEncryptedApiKey: existing.encryptedApiKey,
      }),
      baseUrl: parsed.baseUrl ?? existing.baseUrl,
      organizationId: parsed.organizationId ?? existing.organizationId,
    });
  }

  const updateResult = await aiIntegrationDomain.commands.update({
    id: input.credentialId,
    userId: input.userId,
    data: parsed,
  });

  let credential = updateResult.data;
  if (needsRetest) {
    const connectedResult = await aiIntegrationDomain.commands.update({
      id: input.credentialId,
      userId: input.userId,
      data: {
        connectionStatus: AiIntegrationConnectionStatus.Connected,
        lastTestedAt: new Date(),
        lastConnectionError: null,
      },
    });
    credential = connectedResult.data;
  }

  return { credential: await enrichCredentialResponse({ credential }) };
};

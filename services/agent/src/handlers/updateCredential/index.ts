import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import { validatorFactory } from '@vassembly/validation';

import { assertModelInProviderList } from '../../helpers/assertModelInProviderList';
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

  const existingResult = await aiIntegrationDomain.queries.getModelById({
    id: input.credentialId,
    userId: input.userId,
  });
  const existing = existingResult.data;
  const needsRetest = shouldRetestConnection({ existing, body: parsed });

  if (needsRetest) {
    const connectionResult = await aiIntegrationDomain.commands.assertProviderConnection({
      provider: existing.provider ?? '',
      apiKey: resolveApiKeyForTest({
        bodyApiKey: parsed.apiKey,
        existingEncryptedApiKey: existing.encryptedApiKey,
      }),
      baseUrl: parsed.baseUrl ?? existing.baseUrl,
      organizationId: parsed.organizationId ?? existing.organizationId,
    });

    if (parsed.model !== undefined) {
      assertModelInProviderList({ model: parsed.model, models: connectionResult.models });
    }
  }

  const updateResult = await aiIntegrationDomain.commands.update({
    id: input.credentialId,
    userId: input.userId,
    data: {
      ...parsed,
      baseUrl: parsed.baseUrl === null ? undefined : parsed.baseUrl,
      organizationId: parsed.organizationId === null ? undefined : parsed.organizationId,
    },
  });

  let credential = updateResult.data;
  if (needsRetest) {
    const connectedResult = await aiIntegrationDomain.commands.update({
      id: input.credentialId,
      userId: input.userId,
      data: {
        connectionStatus: AiIntegrationConnectionStatus.Connected,
        lastTestedAt: new Date(),
      },
    });
    credential = connectedResult.data;
  }

  return { credential: await enrichCredentialResponse({ credential }) };
};

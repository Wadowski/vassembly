import aiIntegrationDomain, { AiIntegrationConnectionStatus } from '@vassembly/domain-ai-integration';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { assertModelInProviderList } from '../../helpers/assertModelInProviderList';
import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';

import { CREATE_CREDENTIAL_BODY_SCHEMA } from './types';

import type { CreateCredentialHandlerInput, CreateCredentialHandlerOutput } from './types';

const validateCreateCredentialBody = validatorFactory(CREATE_CREDENTIAL_BODY_SCHEMA);

const setFirstSystemAgentPreferenceIfMissing = async ({
  userId,
  credentialId,
}: {
  userId: string;
  credentialId: string;
}): Promise<boolean> => {
  try {
    const existingPref = await systemAgentDomain.queries.getPreferenceByUserId({ userId });

    if (existingPref.data) {
      return false;
    }

    await systemAgentDomain.commands.upsertPreference({
      userId,
      integrationCredentialId: credentialId,
    });

    return true;
  } catch (error) {
    console.error('system_agent.preference.set failed', error);
    return false;
  }
};

export const createCredential = async (
  input: CreateCredentialHandlerInput,
): Promise<CreateCredentialHandlerOutput> => {
  const parsedResult = validateCreateCredentialBody(input.body);
  if (!parsedResult.success) {
    throw parsedResult.error;
  }
  const parsed = parsedResult.data;

  const connectionResult = await aiIntegrationDomain.commands.assertProviderConnection({
    provider: parsed.provider,
    apiKey: parsed.apiKey,
    baseUrl: parsed.baseUrl,
    organizationId: parsed.organizationId,
  });

  assertModelInProviderList({ model: parsed.model, models: connectionResult.models });

  const createResult = await aiIntegrationDomain.commands.create({
    userId: input.userId,
    name: parsed.name,
    provider: parsed.provider,
    apiKey: parsed.apiKey,
    baseUrl: parsed.baseUrl ?? undefined,
    organizationId: parsed.organizationId ?? undefined,
    model: parsed.model,
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
    },
  });

  const credential = await enrichCredentialResponse({ credential: updateResult.data });
  const isFirstSystemAgentPreference = await setFirstSystemAgentPreferenceIfMissing({
    userId: input.userId,
    credentialId,
  });

  return {
    credential,
    ...(isFirstSystemAgentPreference ? { isFirstSystemAgentPreference: true } : {}),
  };
};

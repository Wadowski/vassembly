import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import systemAgentDomain, { throwSystemAgentNotFoundError } from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';

import type { InvokeSystemAgentParams, InvokeSystemAgentResult } from './types';

export const invokeSystemAgent = async (
  input: InvokeSystemAgentParams,
): Promise<InvokeSystemAgentResult> => {
  const { userId, systemAgentId, message, connectionOverride } = input;

  if (connectionOverride?.integrationCredentialId) {
    await userDomain.queries.assertHasRole({ userId, role: AUTH_TOKEN_ROLE.ADMIN });
  }

  const agentResult = await systemAgentDomain.queries.getActiveById({ id: systemAgentId });

  if (!agentResult.data) {
    throwSystemAgentNotFoundError();
  }

  let connectionOverrideParam = connectionOverride;
  if (!connectionOverride) {
    const preference = (await systemAgentDomain.queries.getPreferenceByUserId({ userId })).data;
    if (preference?.integrationCredentialId) {
      connectionOverrideParam = { integrationCredentialId: preference.integrationCredentialId };
    }
  }

  const modeledProviderClient = await aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    connectionOverride: connectionOverrideParam,
  });

  return systemAgentDomain.commands.invoke({
    modeledProviderClient,
    systemAgentId,
    message,
  });
};

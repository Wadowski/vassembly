import { AuthTokenRole } from '@vassembly/domain-auth-token';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import systemAgentDomain, { throwSystemAgentNotFoundError } from '@vassembly/domain-system-agent';
import { ForbiddenError } from '@vassembly/errors';

import type { InvokeSystemAgentParams, InvokeSystemAgentResult } from './types';

export const invokeSystemAgent = async (
  input: InvokeSystemAgentParams,
): Promise<InvokeSystemAgentResult> => {
  const { userId, role, systemAgentId, message, connectionOverride } = input;

  if (connectionOverride?.integrationCredentialId && role !== AuthTokenRole.ADMIN) {
    throw new ForbiddenError('Connection override is admin-only', {
      code: 'CONNECTION_OVERRIDE_FORBIDDEN',
    });
  }

  const agentResult = await systemAgentDomain.queries.getActiveById({ id: systemAgentId });

  if (!agentResult.data) {
    throwSystemAgentNotFoundError();
  }

  const modeledProviderClient = await aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    role,
    connectionOverride,
  });

  return systemAgentDomain.commands.invoke({
    modeledProviderClient,
    systemAgentId,
    message,
  });
};

import { randomUUID } from 'node:crypto';

import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import userDomain from '@vassembly/domain-user';

import { runAgentInvokeWithTools } from '../../internalTools/runAgentInvokeWithTools';
import { resolveSystemCallCredentialId } from '../shared/resolveSystemCallCredentialId';

import type { InvokeSystemAgentParams, InvokeSystemAgentResult } from './types';

export const invokeSystemAgent = async (
  input: InvokeSystemAgentParams,
): Promise<InvokeSystemAgentResult> => {
  const { userId, systemAgentId, message, connectionOverride } = input;

  if (connectionOverride?.integrationCredentialId) {
    await userDomain.queries.assertHasRole({ userId, role: AUTH_TOKEN_ROLE.ADMIN });
  }

  let connectionOverrideParam = connectionOverride;
  if (!connectionOverride) {
    try {
      const credentialId = await resolveSystemCallCredentialId({ userId });
      connectionOverrideParam = { integrationCredentialId: credentialId };
    } catch {
      connectionOverrideParam = undefined;
    }
  }

  const result = await runAgentInvokeWithTools({
    userId,
    agentType: 'system',
    agentId: systemAgentId,
    message,
    connectionOverride: connectionOverrideParam,
    toolContext: {
      userId,
      taskId: '',
      invocationId: randomUUID(),
      callerAgentId: systemAgentId,
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: randomUUID(),
    },
  });

  return {
    message: result.message,
    usage: result.usage,
    metadata: {
      model: result.metadata?.model,
      provider: result.metadata?.provider,
      mcpIdsUsed: result.metadata.mcpIdsUsed,
      skippedMcpIds: result.metadata.skippedMcpIds,
      internalToolIdsUsed: result.metadata.internalToolIdsUsed,
      skippedInternalToolIds: result.metadata.skippedInternalToolIds,
      maxUseAgentDepth: result.metadata.maxUseAgentDepth,
    },
  };
};

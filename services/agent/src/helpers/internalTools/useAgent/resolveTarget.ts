import agentDomain from '@vassembly/domain-agent';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError } from '@vassembly/errors';

import {
  buildUseAgentNotFoundError,
  USE_AGENT_AMBIGUITY_ERROR,
  USE_AGENT_NOT_ALLOWED_ERROR,
  USE_AGENT_NO_CREDENTIAL_ERROR,
} from '../constants';

import type { ResolveTargetParams, ResolveTargetResult } from './types';

const LIST_PAGE = 0;
const LIST_SIZE = 50;

const isNotFoundError = (error: unknown): boolean => error instanceof NotFoundError;

const findPersonalMatchesByName = async ({
  userId,
  name,
}: {
  userId: string;
  name: string;
}): Promise<Array<{ id?: string; integrationCredentialId?: string }>> => {
  const result = await agentDomain.queries.getListForUser({
    userId,
    page: LIST_PAGE,
    size: LIST_SIZE,
  });

  const normalizedName = name.toLowerCase();

  return result.items.filter((agent) => agent.name?.toLowerCase() === normalizedName);
};

const resolvePersonalTarget = async ({
  name,
  context,
}: ResolveTargetParams): Promise<ResolveTargetResult> => {
  const matches = await findPersonalMatchesByName({ userId: context.userId, name });

  if (matches.length > 1) {
    return { error: USE_AGENT_AMBIGUITY_ERROR };
  }

  if (matches.length === 1) {
    const target = matches[0];

    if (!target?.id || !target.integrationCredentialId) {
      return { error: USE_AGENT_NO_CREDENTIAL_ERROR };
    }

    return {
      agentType: 'personal',
      agentId: target.id,
      connectionOverride: { integrationCredentialId: target.integrationCredentialId },
    };
  }

  try {
    await systemAgentDomain.queries.getActiveByName({ name });
    return { error: USE_AGENT_NOT_ALLOWED_ERROR };
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  return { error: buildUseAgentNotFoundError({ name }) };
};

const resolveSystemCallerTarget = async ({
  name,
  context,
}: ResolveTargetParams): Promise<ResolveTargetResult> => {
  try {
    const systemResult = await systemAgentDomain.queries.getActiveByName({ name });
    const preference = await systemAgentDomain.queries.getPreferenceByUserId({
      userId: context.userId,
    });
    const credentialId = preference.data?.integrationCredentialId;

    if (!systemResult.data.id || !credentialId) {
      return { error: USE_AGENT_NO_CREDENTIAL_ERROR };
    }

    return {
      agentType: 'system',
      agentId: systemResult.data.id,
      connectionOverride: { integrationCredentialId: credentialId },
    };
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const matches = await findPersonalMatchesByName({ userId: context.userId, name });

  if (matches.length > 1) {
    return { error: USE_AGENT_AMBIGUITY_ERROR };
  }

  if (matches.length === 1) {
    const target = matches[0];

    if (!target?.id || !target.integrationCredentialId) {
      return { error: USE_AGENT_NO_CREDENTIAL_ERROR };
    }

    return {
      agentType: 'personal',
      agentId: target.id,
      connectionOverride: { integrationCredentialId: target.integrationCredentialId },
    };
  }

  return { error: buildUseAgentNotFoundError({ name }) };
};

export const resolveTarget = async (params: ResolveTargetParams): Promise<ResolveTargetResult> => {
  if (params.context.callerAgentType === 'personal') {
    return resolvePersonalTarget(params);
  }

  return resolveSystemCallerTarget(params);
};

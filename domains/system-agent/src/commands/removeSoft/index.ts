import { removeSoftDb } from '@vassembly/commands';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { AgentStatus } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { SystemAgentModel, systemAgentFactory } from '../../model';
import { getModelById } from '../../queries';

import type { RemoveSoftParams, RemoveSoftResult } from './types';

const NOT_FOUND_MESSAGE = 'System agent not found';
const ALREADY_ARCHIVED_MESSAGE = 'Archive requires active system agent';

export const removeSoft = async (input: RemoveSoftParams): Promise<RemoveSoftResult> => {
  const existing = await getModelById({ id: input.id });

  if (existing.data === null) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  if (
    existing.data.status === AgentStatus.Archived ||
    existing.data.removedAt != null
  ) {
    throw new WrongParamError(ALREADY_ARCHIVED_MESSAGE);
  }

  const persistRemoveSoft = removeSoftDb<SystemAgentModel>({
    dao: systemAgentMongodbDao,
    factory: systemAgentFactory,
    additionalPartial: () => ({
      status: AgentStatus.Archived,
      updatedByAdminId: input.updatedByAdminId,
    }),
  });

  return persistRemoveSoft({ id: input.id });
};

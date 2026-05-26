import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { AgentStatus } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory } from '../../model';
import { getModelById } from '../../queries';

import type { RestoreParams, RestoreResult } from './types';

const NOT_FOUND_MESSAGE = 'System agent not found';
const NOT_ARCHIVED_MESSAGE = 'Restore requires archived system agent';

export const restore = async (input: RestoreParams): Promise<RestoreResult> => {
  const existing = await getModelById({ id: input.id });

  if (existing.data === null) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  if (existing.data.removedAt == null && existing.data.status !== AgentStatus.Archived) {
    throw new WrongParamError(NOT_ARCHIVED_MESSAGE);
  }

  const where = systemAgentFactory.create({ id: input.id });
  const updatedInstance = systemAgentFactory.create({
    removedAt: null,
    status: AgentStatus.Active,
    updatedByAdminId: input.restoredByAdminId,
    updatedAt: new Date(),
  });

  await systemAgentMongodbDao.update(where, updatedInstance);

  const raw = await systemAgentMongodbDao.get(where);

  if (!raw || raw.id === undefined) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  return {
    data: systemAgentFactory.create(raw),
  };
};

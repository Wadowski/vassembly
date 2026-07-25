import { NotFoundError, WrongParamError } from '@vassembly/errors';
import { ObjectId } from 'mongodb';

import { userMcpConfigDao } from '../../clients/mongodb';
import { UserMcpConfigFactory } from '../../model/factory';
import type { UserMcpConfigModel } from '../../model/model';
import { mcpRequiresConfiguration } from '../../utils/mcpRequiresConfiguration';
import { toModel, toStoredRecord } from '../shared/toModel';
import { validateFieldValues } from '../shared/validateFieldValues';

import type { SetUserMcpEnabledInput } from './types';

export type { SetUserMcpEnabledInput };

export const setUserMcpEnabled = async (
  input: SetUserMcpEnabledInput,
): Promise<UserMcpConfigModel> => {
  const { userId, mcpId, enabled, schema } = input;
  const requiresConfiguration = mcpRequiresConfiguration({ schema });
  const existing = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (!enabled) {
    if (!existing) {
      throw new NotFoundError('Configuration not found');
    }

    const model = UserMcpConfigFactory.withEnabled({
      model: toModel({ record: existing }),
      enabled: false,
    });
    const updated = await userMcpConfigDao.update({ model: toStoredRecord({ model }) });

    return toModel({ record: updated });
  }

  if (requiresConfiguration && !existing) {
    throw new WrongParamError('Configure MCP before enabling');
  }

  if (existing) {
    const model = UserMcpConfigFactory.withEnabled({
      model: toModel({ record: existing }),
      enabled: true,
    });
    const updated = await userMcpConfigDao.update({ model: toStoredRecord({ model }) });

    return toModel({ record: updated });
  }

  validateFieldValues({ schema, values: {} });

  const model = UserMcpConfigFactory.createNew({
    userId,
    mcpId,
    fieldValues: {},
    id: new ObjectId().toString(),
  });

  const created = await userMcpConfigDao.create({ model: toStoredRecord({ model }) });

  return toModel({ record: created });
};

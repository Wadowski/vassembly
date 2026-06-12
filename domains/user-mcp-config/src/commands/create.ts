import { ConflictError } from '@vassembly/errors';
import { ObjectId } from 'mongodb';

import { userMcpConfigDao } from '../clients/mongodb';
import { USER_MCP_CONFIG_STATUS } from '../constants';
import { UserMcpConfigFactory } from '../model/factory';
import type { McpConfigSchema } from '../model/configSchema';
import type { UserMcpConfigModel } from '../model/model';
import { encryptPasswordFields } from './shared/encryptPasswordFields';
import { toModel, toStoredRecord } from './shared/toModel';
import { validateFieldValues } from './shared/validateFieldValues';

export interface CreateCommandInput {
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
}

export const createUserMcpConfig = async (input: CreateCommandInput): Promise<UserMcpConfigModel> => {
  const { userId, mcpId, fieldValues, schema } = input;

  validateFieldValues({ schema, values: fieldValues });

  const existing = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (existing) {
    throw new ConflictError('Configuration already exists for this MCP');
  }

  const model = UserMcpConfigFactory.fromDTO({
    input: { mcpId, fieldValues },
    userId,
  });
  model.id = new ObjectId().toString();
  model.status = USER_MCP_CONFIG_STATUS.Configured;
  model.lastTestedAt = new Date();
  model.fieldValues = encryptPasswordFields({ fieldValues, schema });

  const created = await userMcpConfigDao.create({ model: toStoredRecord({ model }) });

  return toModel({ record: created });
};

import { NotFoundError } from '@vassembly/errors';

import { userMcpConfigDao } from '../clients/mongodb';
import type { McpConfigSchema } from '../model/configSchema';
import type { UserMcpConfigModel } from '../model/model';
import { encryptPasswordFields } from './shared/encryptPasswordFields';
import { toModel, toStoredRecord } from './shared/toModel';
import { validateFieldValues } from './shared/validateFieldValues';

export interface UpdateCommandInput {
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
}

const mergeFieldValues = ({
  existingFieldValues,
  fieldValues,
}: {
  existingFieldValues: Record<string, string | boolean>;
  fieldValues: Record<string, string | boolean>;
}): Record<string, string | boolean> => {
  const merged = { ...existingFieldValues };

  for (const [key, value] of Object.entries(fieldValues)) {
    if (value === '' || value === undefined) {
      continue;
    }

    merged[key] = value;
  }

  return merged;
};

export const updateUserMcpConfig = async (input: UpdateCommandInput): Promise<UserMcpConfigModel> => {
  const { userId, mcpId, fieldValues, schema } = input;

  const existing = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (!existing) {
    throw new NotFoundError('Configuration not found');
  }

  const merged = mergeFieldValues({
    existingFieldValues: existing.fieldValues,
    fieldValues,
  });

  validateFieldValues({ schema, values: merged });

  const model = toModel({ record: existing });
  model.fieldValues = encryptPasswordFields({ fieldValues: merged, schema });
  model.updatedAt = new Date();

  const updated = await userMcpConfigDao.update({ model: toStoredRecord({ model }) });

  return toModel({ record: updated });
};

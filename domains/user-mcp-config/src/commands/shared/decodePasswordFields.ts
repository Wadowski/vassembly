import { decode } from '@vassembly/client-encoder';

import { McpConfigFieldType } from '../../model/configSchema';
import type { McpConfigSchema } from '../../model/configSchema';
import { isEncryptedValue } from './isEncryptedValue';

export interface DecodePasswordFieldsParams {
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
}

export const decodePasswordFields = ({
  fieldValues,
  schema,
}: DecodePasswordFieldsParams): Record<string, string | boolean> => {
  const result = { ...fieldValues };

  for (const field of schema.fields) {
    if (field.type !== McpConfigFieldType.Password || !(field.key in result)) {
      continue;
    }

    const value = result[field.key];

    if (typeof value !== 'string' || !isEncryptedValue({ value: value })) {
      continue;
    }

    result[field.key] = decode(value);
  }

  return result;
};

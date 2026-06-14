import { encode } from '@vassembly/client-encoder';

import type { McpConfigSchema } from '../../model/configSchema';
import { McpConfigFieldType } from '../../model/configSchema';
import { isEncryptedValue } from './isEncryptedValue';

export interface EncryptPasswordFieldsParams {
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
}

export const encryptPasswordFields = ({
  fieldValues,
  schema,
}: EncryptPasswordFieldsParams): Record<string, string | boolean> => {
  const result = { ...fieldValues };

  for (const field of schema.fields) {
    if (field.type !== McpConfigFieldType.Password || !(field.key in result)) {
      continue;
    }

    const plainValue = result[field.key];

    if (typeof plainValue !== 'string' || !plainValue) {
      continue;
    }

    if (isEncryptedValue({ value: plainValue })) {
      continue;
    }

    result[field.key] = encode(plainValue);
  }

  return result;
};

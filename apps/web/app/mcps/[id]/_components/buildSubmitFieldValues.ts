import type { McpConfigSchemaField } from '@vassembly/ui-api-hooks';

export interface BuildSubmitFieldValuesParams {
  fields: McpConfigSchemaField[];
  values: Record<string, string | boolean>;
}

/**
 * Builds API payload omitting blank password fields so existing secrets are retained.
 */
export const buildSubmitFieldValues = ({
  fields,
  values,
}: BuildSubmitFieldValuesParams): Record<string, string | boolean> => {
  const payload: Record<string, string | boolean> = {};

  for (const field of fields) {
    const value = values[field.key];

    if (field.type === 'password') {
      if (typeof value === 'string' && value !== '') {
        payload[field.key] = value;
      }
      continue;
    }

    if (field.type === 'checkbox') {
      payload[field.key] = value === true;
      continue;
    }

    if (typeof value === 'string' && value !== '') {
      payload[field.key] = value;
    }
  }

  return payload;
};

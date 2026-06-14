import type { McpConfigSchemaField, McpConfiguration } from '@vassembly/ui-api-hooks';

export interface BuildInitialFieldValuesParams {
  fields: McpConfigSchemaField[];
  savedConfiguration?: McpConfiguration | null;
}

export interface BuildInitialFieldValuesResult {
  values: Record<string, string | boolean>;
  savedSecretKeys: Set<string>;
}

const isPasswordField = (field: McpConfigSchemaField): boolean => field.type === 'password';

/**
 * Builds initial form values and tracks which secret fields exist in saved configuration.
 */
export const buildInitialFieldValues = ({
  fields,
  savedConfiguration,
}: BuildInitialFieldValuesParams): BuildInitialFieldValuesResult => {
  const values: Record<string, string | boolean> = {};
  const savedSecretKeys = new Set<string>();

  for (const field of fields) {
    if (field.type === 'checkbox') {
      values[field.key] = false;
    } else {
      values[field.key] = '';
    }
  }

  if (savedConfiguration !== undefined && savedConfiguration !== null) {
    for (const fieldValue of savedConfiguration.fieldValues) {
      if (fieldValue.hasSecret === true) {
        savedSecretKeys.add(fieldValue.key);
        continue;
      }

      if (fieldValue.value !== undefined) {
        values[fieldValue.key] = fieldValue.value;
      }
    }
  }

  for (const field of fields) {
    if (field.defaultValue !== undefined && values[field.key] === '' && !isPasswordField(field)) {
      values[field.key] = field.defaultValue;
    }
  }

  return { values, savedSecretKeys };
};

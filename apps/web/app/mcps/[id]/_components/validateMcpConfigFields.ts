import type { McpConfigSchemaField } from '@vassembly/ui-api-hooks';
import { z } from 'zod';

export interface ValidateMcpConfigFieldsParams {
  fields: McpConfigSchemaField[];
  values: Record<string, string | boolean>;
  savedSecretKeys: Set<string>;
}

const buildTextSchema = ({ field }: { field: McpConfigSchemaField }): z.ZodTypeAny => {
  let schema = z.string();

  if (field.format === 'email') {
    schema = schema.email({ message: 'Enter a valid email' });
  } else if (field.format === 'url') {
    schema = schema.url({ message: 'Enter a valid URL' });
  }

  if (field.required) {
    return schema.min(1, `${field.label} is required`);
  }

  return z.union([z.literal(''), schema]);
};

const buildPasswordSchema = ({
  field,
  hasSavedSecret,
}: {
  field: McpConfigSchemaField;
  hasSavedSecret: boolean;
}): z.ZodTypeAny => {
  if (hasSavedSecret) {
    return z.string();
  }

  if (field.required) {
    return z.string().min(1, `${field.label} is required`);
  }

  return z.string();
};

const buildSelectSchema = ({ field }: { field: McpConfigSchemaField }): z.ZodTypeAny => {
  const allowedValues = field.options?.map((option) => option.value) ?? [];

  if (allowedValues.length === 0) {
    return z.string();
  }

  const enumSchema = z.enum(allowedValues as [string, ...string[]]);

  if (field.required) {
    return enumSchema;
  }

  return z.union([z.literal(''), enumSchema]);
};

const buildFieldSchema = ({
  field,
  savedSecretKeys,
}: {
  field: McpConfigSchemaField;
  savedSecretKeys: Set<string>;
}): z.ZodTypeAny => {
  if (field.type === 'checkbox') {
    return field.required ? z.literal(true, { message: `${field.label} is required` }) : z.boolean();
  }

  if (field.type === 'password') {
    return buildPasswordSchema({ field, hasSavedSecret: savedSecretKeys.has(field.key) });
  }

  if (field.type === 'select') {
    return buildSelectSchema({ field });
  }

  return buildTextSchema({ field });
};

export const validateMcpConfigFields = ({
  fields,
  values,
  savedSecretKeys,
}: ValidateMcpConfigFieldsParams): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const fieldSchema = buildFieldSchema({ field, savedSecretKeys });
    const value = values[field.key];
    const parsedValue = field.type === 'checkbox' ? value : String(value ?? '');
    const result = fieldSchema.safeParse(parsedValue);

    if (!result.success) {
      const issue = result.error.issues[0];
      errors[field.key] = issue?.message ?? `${field.label} is invalid`;
    }
  }

  return errors;
};

export const validateMcpConfigField = ({
  field,
  value,
  savedSecretKeys,
}: {
  field: McpConfigSchemaField;
  value: string | boolean;
  savedSecretKeys: Set<string>;
}): string | undefined => {
  const errors = validateMcpConfigFields({
    fields: [field],
    values: { [field.key]: value },
    savedSecretKeys,
  });

  return errors[field.key];
};

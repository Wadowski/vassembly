import { z } from 'zod';
import { WrongParamError } from '@vassembly/errors';

import type { McpConfigFieldSchema, McpConfigSchema } from '../../model/configSchema';
import { McpConfigFieldType } from '../../model/configSchema';

export interface ValidateFieldValuesParams {
  schema: McpConfigSchema;
  values: Record<string, unknown>;
}

const validateRequiredCheckbox = ({
  field,
  values,
}: {
  field: McpConfigFieldSchema;
  values: Record<string, unknown>;
}): void => {
  if (field.type !== McpConfigFieldType.Checkbox || !field.required) {
    return;
  }

  if (values[field.key] !== true) {
    throw new WrongParamError(`${field.key} must be checked`);
  }
};

const buildTextFieldSchema = ({ field }: { field: McpConfigFieldSchema }): z.ZodTypeAny => {
  if (field.format === 'email') {
    return z.email();
  }

  if (field.format === 'url') {
    return z.url();
  }

  const minLength = field.minLength ?? (field.required ? 1 : 0);
  let fieldSchema = z.string().min(minLength).max(field.maxLength ?? 9999);

  if (field.pattern) {
    fieldSchema = fieldSchema.regex(new RegExp(field.pattern));
  }

  return fieldSchema;
};

const buildFieldSchema = ({ field }: { field: McpConfigFieldSchema }): z.ZodTypeAny => {
  let fieldSchema: z.ZodTypeAny;

  if (field.type === McpConfigFieldType.Text) {
    fieldSchema = buildTextFieldSchema({ field });
  } else if (field.type === McpConfigFieldType.Password) {
    const minLength = field.minLength ?? (field.required ? 1 : 0);
    fieldSchema = z.string().min(minLength).max(field.maxLength ?? 9999);
  } else if (field.type === McpConfigFieldType.Select) {
    const allowedValues = field.options?.map((option) => option.value) ?? [];

    if (allowedValues.length === 0) {
      throw new WrongParamError(`Select field ${field.key} has no options`);
    }

    fieldSchema = z.enum(allowedValues as [string, ...string[]]);
  } else if (field.type === McpConfigFieldType.Checkbox) {
    fieldSchema = z.boolean();
  } else {
    throw new WrongParamError(`Unknown field type: ${field.type}`);
  }

  if (!field.required) {
    return fieldSchema.optional();
  }

  return fieldSchema;
};

const formatZodError = ({
  issue,
  field,
}: {
  issue: z.ZodIssue;
  field?: McpConfigFieldSchema;
}): string => {
  const fieldName = String(issue.path.join('.'));

  if (issue.message.includes('received undefined')) {
    return `${fieldName} is required`;
  }

  if (issue.message.includes('Too small') && field?.required && (field.minLength ?? 1) <= 1) {
    return `${fieldName} is required`;
  }

  if (issue.message.includes('Too small') && field?.minLength !== undefined) {
    return `${fieldName} minimum length is ${field.minLength}`;
  }

  if (field?.type === McpConfigFieldType.Select) {
    const allowedValues = field.options?.map((option) => option.value) ?? [];
    return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
  }

  return `${fieldName} ${issue.message}`;
};

export const validateFieldValues = ({ schema, values }: ValidateFieldValuesParams): void => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  const fieldByKey = new Map(schema.fields.map((field) => [field.key, field]));

  for (const field of schema.fields) {
    schemaObject[field.key] = buildFieldSchema({ field });
  }

  const validator = z.object(schemaObject);

  try {
    validator.parse(values);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];

      if (!firstError) {
        throw error;
      }

      const field = fieldByKey.get(String(firstError.path[0]));
      throw new WrongParamError(formatZodError({ issue: firstError, field }));
    }

    throw error;
  }

  for (const field of schema.fields) {
    validateRequiredCheckbox({ field, values });
  }
};

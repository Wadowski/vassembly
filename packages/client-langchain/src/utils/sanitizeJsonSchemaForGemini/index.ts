import { flattenNullableAnyOf, normalizeTypeField } from './normalizeTypeField';

import type { JsonSchemaValue, SanitizeJsonSchemaForGeminiParams } from './types';

const isJsonSchemaObject = (value: unknown): value is JsonSchemaValue => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const sanitizeSchemaNode = (schema: unknown): unknown => {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaNode);
  }

  if (!isJsonSchemaObject(schema)) {
    return schema;
  }

  const schemaWithoutMeta = { ...schema };
  delete schemaWithoutMeta.$schema;
  let normalized: JsonSchemaValue = schemaWithoutMeta;

  normalized = flattenNullableAnyOf({ schema: normalized });
  normalized = normalizeTypeField({ schema: normalized });

  if (isJsonSchemaObject(normalized.properties)) {
    const sanitizedProperties: JsonSchemaValue = {};

    for (const [key, value] of Object.entries(normalized.properties)) {
      sanitizedProperties[key] = sanitizeSchemaNode(value) as JsonSchemaValue[string];
    }

    normalized = { ...normalized, properties: sanitizedProperties };
  }

  if ('items' in normalized) {
    normalized = { ...normalized, items: sanitizeSchemaNode(normalized.items) };
  }

  if (isJsonSchemaObject(normalized.additionalProperties)) {
    normalized = {
      ...normalized,
      additionalProperties: sanitizeSchemaNode(normalized.additionalProperties),
    };
  }

  return normalized;
};

export const sanitizeJsonSchemaForGemini = ({
  schema,
}: SanitizeJsonSchemaForGeminiParams): unknown => {
  return sanitizeSchemaNode(schema);
};

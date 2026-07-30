import type { JsonSchemaValue } from './types';

const NULL_TYPE = 'null';

const isNullTypeSchema = (value: unknown): boolean => {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === NULL_TYPE;
};

export const normalizeTypeField = ({ schema }: { schema: JsonSchemaValue }): JsonSchemaValue => {
  const typeValue = schema.type;

  if (!Array.isArray(typeValue)) {
    return schema;
  }

  const nonNullTypes = typeValue.filter((entry) => entry !== NULL_TYPE);
  const isNullable = typeValue.includes(NULL_TYPE);

  if (nonNullTypes.length === 0) {
    return { ...schema, type: 'string', nullable: true };
  }

  return {
    ...schema,
    type: nonNullTypes[0],
    ...(isNullable ? { nullable: true } : {}),
  };
};

export const flattenNullableAnyOf = ({ schema }: { schema: JsonSchemaValue }): JsonSchemaValue => {
  const anyOf = schema.anyOf;

  if (!Array.isArray(anyOf)) {
    return schema;
  }

  const hasNullBranch = anyOf.some(isNullTypeSchema);
  const nonNullBranches = anyOf.filter((entry) => !isNullTypeSchema(entry));

  if (!hasNullBranch || nonNullBranches.length !== 1) {
    return schema;
  }

  const branch = nonNullBranches[0];

  if (typeof branch !== 'object' || branch === null) {
    return schema;
  }

  const { anyOf: _removedAnyOf, ...rest } = schema;

  return {
    ...rest,
    ...branch,
    nullable: true,
  };
};

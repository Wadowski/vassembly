const isNullishSentinel = (value: unknown): boolean => {
  return value === null || value === 'null' || value === 'none' || value === '';
};

export const coerceNullableFields = ({
  record,
  fields,
}: {
  record: Record<string, unknown>;
  fields: string[];
}): Record<string, unknown> => {
  if (fields.length === 0) {
    return record;
  }

  const fieldSet = new Set(fields);
  const result: Record<string, unknown> = { ...record };

  for (const field of fieldSet) {
    if (field in result && isNullishSentinel(result[field])) {
      result[field] = undefined;
    }
  }

  return result;
};

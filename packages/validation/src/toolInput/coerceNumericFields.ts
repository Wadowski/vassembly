const coerceNumericValue = (value: unknown): unknown => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return value;
    }

    const parsed = Number(trimmed);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return value;
};

export const coerceNumericFields = ({
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
    if (field in result) {
      result[field] = coerceNumericValue(result[field]);
    }
  }

  return result;
};

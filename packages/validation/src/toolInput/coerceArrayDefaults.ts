export const coerceArrayDefaults = ({
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
    const value = result[field];

    if (value === null || value === undefined) {
      result[field] = [];
    }
  }

  return result;
};

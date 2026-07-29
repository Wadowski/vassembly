import { tryParseJson } from './tryParseJson';

const coerceRecordJsonValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return {};
    }

    const parsed = tryParseJson({ raw: trimmed });

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }

    return { summary: value };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  return { value };
};

export const coerceRecordJsonFields = ({
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
      result[field] = coerceRecordJsonValue(result[field]);
    }
  }

  return result;
};

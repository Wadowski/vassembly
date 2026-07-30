import { coerceArrayDefaults } from './coerceArrayDefaults';
import { coerceNullableFields } from './coerceNullableFields';
import { coerceNumericFields } from './coerceNumericFields';
import { coerceRecordJsonFields } from './coerceRecordJsonFields';
import { coerceStringifiedJson } from './coerceStringifiedJson';

import type { ShapeCoercionConfig } from './types';

const toRecord = (value: unknown): Record<string, unknown> => {
  const parsed = coerceStringifiedJson({ raw: value });

  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  return {};
};

export const normalizeToolInputShape = ({
  raw,
  config,
}: {
  raw: unknown;
  config: ShapeCoercionConfig;
}): Record<string, unknown> => {
  const record = toRecord(raw);
  const withNullableDefaults = coerceNullableFields({
    record,
    fields: config.nullableToUndefinedFields ?? [],
  });
  const withArrayDefaults = coerceArrayDefaults({
    record: withNullableDefaults,
    fields: config.arrayDefaultFields ?? [],
  });
  const withRecordJsonFields = coerceRecordJsonFields({
    record: withArrayDefaults,
    fields: config.recordJsonFields ?? [],
  });

  return coerceNumericFields({
    record: withRecordJsonFields,
    fields: config.numericFields ?? [],
  });
};

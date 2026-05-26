import { toIsoString, type ToIsoStringParams } from './toIsoString';
import { toNullableIsoString } from './toNullableIsoString';

export interface MapTimestampFieldsParams<T extends object> {
  entity: T;
  fields: ReadonlyArray<keyof T>;
}

export interface MapTimestampFieldsResult {
  [key: string]: string;
}

export const mapTimestampFields = <T extends object>({
  entity,
  fields,
}: MapTimestampFieldsParams<T>): MapTimestampFieldsResult => {
  const result: MapTimestampFieldsResult = {};

  for (const field of fields) {
    const value = entity[field];
    if (value instanceof Date) {
      result[String(field)] = toIsoString({
        value,
        fieldName: String(field),
      });
    } else if (value === null || value === undefined) {
      result[String(field)] = null as never;
    }
  }

  return result;
};

export { toIsoString, type ToIsoStringParams, toNullableIsoString };

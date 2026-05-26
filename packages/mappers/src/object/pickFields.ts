export interface PickFieldsParams<T extends object> {
  source: T;
  keys: ReadonlyArray<keyof T>;
}

export type PickFieldsResult<T extends object, K extends keyof T> = {
  [P in K]: T[P];
};

export const pickFields = <T extends object, K extends keyof T>({
  source,
  keys,
}: PickFieldsParams<T> & { keys: ReadonlyArray<K> }): PickFieldsResult<T, K> => {
  const result: Record<K, unknown> = {} as Record<K, unknown>;

  for (const key of keys) {
    result[key] = source[key];
  }

  return result as PickFieldsResult<T, K>;
};

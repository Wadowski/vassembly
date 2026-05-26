export interface OmitFieldsParams<T extends object> {
  source: T;
  keys: ReadonlyArray<keyof T>;
}

export type OmitFieldsResult<T extends object, K extends keyof T> = Omit<T, K>;

export const omitFields = <T extends object, K extends keyof T>({
  source,
  keys,
}: OmitFieldsParams<T> & { keys: ReadonlyArray<K> }): OmitFieldsResult<T, K> => {
  const result = { ...source };
  for (const key of keys) {
    delete result[key];
  }
  return result as OmitFieldsResult<T, K>;
};

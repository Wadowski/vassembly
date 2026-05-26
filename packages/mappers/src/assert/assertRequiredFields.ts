export interface AssertRequiredFieldsParams<T extends object> {
  entity: T;
  fields: ReadonlyArray<keyof T>;
  entityName: string;
}

export const assertRequiredFields = <T extends object>({
  entity,
  fields,
  entityName,
}: AssertRequiredFieldsParams<T>): void => {
  for (const field of fields) {
    if (entity[field] === undefined) {
      throw new Error(`${entityName} ${String(field)} is required`);
    }
  }
};

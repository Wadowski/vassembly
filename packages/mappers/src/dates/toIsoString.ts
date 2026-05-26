export interface ToIsoStringParams {
  value: Date;
  fieldName: string;
}

export const toIsoString = ({ value, fieldName }: ToIsoStringParams): string => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`${fieldName} must be a valid Date`);
  }
  return value.toISOString();
};

export const toNullableIsoString = (value: Date | null | undefined): string | null => {
  return value ? value.toISOString() : null;
};

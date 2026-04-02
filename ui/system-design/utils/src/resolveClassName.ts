type ClassNameValue = string | false | null | undefined;

export const resolveClassName = (...values: ClassNameValue[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

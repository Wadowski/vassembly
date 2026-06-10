import type { GetNestedValueParams, ResolveItemsArrayParams } from './types';

export const getNestedValue = ({ source, path }: GetNestedValueParams): unknown => {
  const keys = path.split('.');
  let current: unknown = source;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
};

export const resolveItemsArray = ({ source, path }: ResolveItemsArrayParams): unknown[] => {
  const value = getNestedValue({ source, path });

  if (Array.isArray(value)) {
    return value;
  }

  if (value !== null && value !== undefined && typeof value === 'object') {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items;
    }
  }

  return [];
};

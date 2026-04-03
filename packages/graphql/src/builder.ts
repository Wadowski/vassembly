import SchemaBuilder from '@pothos/core';
import type { Builder } from './types';

export const createBuilder = (): Builder => {
  return new SchemaBuilder<Record<string, unknown>>({});
};

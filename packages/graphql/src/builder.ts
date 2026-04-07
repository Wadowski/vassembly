import { DateTimeResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';
import type { Builder } from './types';

export const createBuilder = (): Builder => {
  const builder = new SchemaBuilder<Record<string, unknown>>({});
  builder.queryType({});

  builder.addScalarType('DateTime', DateTimeResolver, {
    serialize: (value: unknown) => value,
  });
  
  return builder;
};

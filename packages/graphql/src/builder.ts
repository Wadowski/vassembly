import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';
import type { Builder } from './types';

export const createBuilder = (): Builder => {
  type SchemaTypes = {
    Scalars: {
      DateTime: { Input: Date; Output: Date };
      JSON: { Input: unknown; Output: unknown };
    };
  };

  const builder = new SchemaBuilder<SchemaTypes>({});
  builder.queryType({});

  builder.addScalarType('DateTime', DateTimeResolver, {
    serialize: (value: unknown) => value as Date,
  });

  builder.addScalarType('JSON', JSONResolver, {});

  return builder as unknown as Builder;
};

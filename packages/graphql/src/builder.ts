import { DateTimeResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';
import type { Builder } from './types';

export const createBuilder = (): Builder => {
  type SchemaTypes = {
    Scalars: {
      DateTime: { Input: Date; Output: Date };
    };
  };

  const builder = new SchemaBuilder<SchemaTypes>({});
  builder.queryType({});

  builder.addScalarType('DateTime', DateTimeResolver, {
    serialize: (value: unknown) => value as Date,
  });

  return builder as unknown as Builder;
};

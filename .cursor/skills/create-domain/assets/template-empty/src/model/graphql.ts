import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const defineDomainSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Domain',
    fields: (t) => ({
      // Add domain-specific fields here
      // Common fields (id, createdAt, updatedAt, removedAt) are automatically included
    }),
  });
};

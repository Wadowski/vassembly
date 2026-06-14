import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlUserSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'User',
    fields: (t) => ({
      email: t.exposeString('email', { nullable: true }),
      firstName: t.exposeString('firstName', { nullable: true }),
      lastName: t.exposeString('lastName', { nullable: true }),
      verifiedAt: t.expose('verifiedAt', { type: 'DateTime', nullable: true }),
    }),
  });
};

import { defineModelSchema, defineObjectType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlUserSchema = (builder: Builder): void => {
  defineObjectType(builder, 'UserOnboarding', {
    fields: (t) => ({
      version: t.exposeInt('version'),
      startedAt: t.expose('startedAt', { type: 'DateTime', nullable: true }),
      completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    }),
  });

  defineModelSchema({
    builder,
    name: 'User',
    fields: (t) => ({
      email: t.exposeString('email', { nullable: true }),
      firstName: t.exposeString('firstName', { nullable: true }),
      lastName: t.exposeString('lastName', { nullable: true }),
      verifiedAt: t.expose('verifiedAt', { type: 'DateTime', nullable: true }),
      onboarding: t.expose('onboarding', { type: 'UserOnboarding', nullable: true }),
    }),
  });
};

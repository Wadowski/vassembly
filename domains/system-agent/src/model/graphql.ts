import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlSystemAgentSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'SystemAgent',
    fields: (t: any) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      description: t.exposeString('description', { nullable: true }),
      rule: t.exposeString('rule'),
      category: t.exposeString('category', { nullable: true }),
      status: t.exposeString('status'),
      createdByAdminId: t.exposeString('createdByAdminId'),
      updatedByAdminId: t.exposeString('updatedByAdminId'),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
      removedAt: t.exposeString('removedAt', { nullable: true }),
    }),
  });

  builder.objectType('SystemAgentsList' as any, {
    fields: (t: any) => ({
      items: t.field({
        type: ['SystemAgent'],
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });

  defineModelSchema({
    builder,
    name: 'SystemAgentPreference',
    fields: (t: any) => ({
      userId: t.exposeString('userId'),
      integrationCredentialId: t.exposeString('integrationCredentialId'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });
};

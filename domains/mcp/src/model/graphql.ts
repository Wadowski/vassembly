import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlMcpSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Mcp',
    fields: (t: any) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      description: t.exposeString('description'),
      tags: t.exposeStringList('tags'),
      iconPath: t.exposeString('iconPath'),
      slug: t.exposeString('slug'),
      documentationUrl: t.exposeString('documentationUrl', { nullable: true }),
      repositoryUrl: t.exposeString('repositoryUrl', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  builder.objectType('McpsList' as any, {
    fields: (t: any) => ({
      items: t.field({
        type: ['Mcp'],
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });

  builder.objectType('AvailableTags' as any, {
    fields: (t: any) => ({
      tags: t.exposeStringList('tags'),
    }),
  });
};

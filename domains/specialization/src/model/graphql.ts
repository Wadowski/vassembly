import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlSpecializationSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Specialization',
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      description: t.exposeString('description'),
      agentIds: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { agentIds?: string[] }) => parent.agentIds ?? null,
      }),
      mcpIds: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { mcpIds?: string[] }) => parent.mcpIds ?? null,
      }),
      agents: t.field({
        type: graphQLListType('SystemAgent'),
        nullable: true,
        resolve: (parent: { agents?: unknown[] }) => parent.agents ?? null,
      }),
      mcps: t.field({
        type: graphQLListType('Mcp'),
        nullable: true,
        resolve: (parent: { mcps?: unknown[] }) => parent.mcps ?? null,
      }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  defineObjectType(builder, 'SpecializationPage', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('Specialization'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

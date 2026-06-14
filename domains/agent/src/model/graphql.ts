import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlAgentSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Agent',
    fields: (t) => ({
      name: t.exposeString('name', { nullable: true }),
      category: t.exposeString('category', { nullable: true }),
      description: t.exposeString('description', { nullable: true }),
      rule: t.exposeString('rule', { nullable: true }),
      userId: t.exposeString('userId', { nullable: true }),
      status: t.exposeString('status', { nullable: true }),
      integrationCredentialId: t.exposeString('integrationCredentialId', { nullable: true }),
      assignedMcpIds: t.exposeStringList('assignedMcpIds'),
      assignedToolIds: t.exposeStringList('assignedToolIds'),
    }),
  });

  defineObjectType(builder, 'AgentsList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('Agent'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      totalCount: t.exposeInt('totalCount'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

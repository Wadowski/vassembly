import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';

import type { Builder } from '@vassembly/graphql';

export const gqlMcpUsageSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'McpUsageEvent',
    fields: (t) => ({
      id: t.exposeString('id'),
      mcpId: t.exposeString('mcpId'),
      mcpSlug: t.exposeString('mcpSlug', { nullable: true }),
      toolName: t.exposeString('toolName'),
      userId: t.exposeString('userId'),
      taskId: t.exposeString('taskId', { nullable: true }),
      commentId: t.exposeString('commentId', { nullable: true }),
      agentId: t.exposeString('agentId'),
      agentName: t.exposeString('agentName', { nullable: true }),
      taskTitle: t.exposeString('taskTitle', { nullable: true }),
      status: t.exposeString('status'),
      startedAt: t.exposeString('startedAt'),
      endedAt: t.exposeString('endedAt', { nullable: true }),
      durationMs: t.exposeInt('durationMs', { nullable: true }),
      input: t.field({
        type: 'String',
        nullable: true,
        resolve: (parent: { input?: Record<string, unknown> | null }) =>
          parent.input ? JSON.stringify(parent.input, null, 2) : null,
      }),
      inputTruncated: t.exposeBoolean('inputTruncated'),
      errorMessage: t.exposeString('errorMessage', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  defineObjectType(builder, 'McpUsageHistoryList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('McpUsageEvent'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

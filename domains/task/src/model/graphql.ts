import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlTaskSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Task',
    fields: (t) => ({
      userId: t.exposeString('userId'),
      description: t.exposeString('description'),
      type: t.exposeString('type'),
      status: t.exposeString('status'),
      agentAssignedId: t.exposeString('agentAssignedId', { nullable: true }),
      title: t.exposeString('title', { nullable: true }),
      llmResponse: t.exposeString('llmResponse', { nullable: true }),
      errorMessage: t.exposeString('errorMessage', { nullable: true }),
      errorCode: t.exposeString('errorCode', { nullable: true }),
      startedAt: t.exposeString('startedAt', { nullable: true }),
      completedAt: t.exposeString('completedAt', { nullable: true }),
      failedAt: t.exposeString('failedAt', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  defineObjectType(builder, 'TasksList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('Task'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      totalCount: t.exposeInt('totalCount'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

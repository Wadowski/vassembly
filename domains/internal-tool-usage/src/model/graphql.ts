import { defineModelSchema } from '@vassembly/graphql';

import type { Builder } from '@vassembly/graphql';

export const gqlInternalToolUsageSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'InternalToolUsageEvent',
    fields: (t) => ({
      id: t.exposeString('id'),
      internalToolId: t.exposeString('internalToolId'),
      internalToolDisplayName: t.exposeString('internalToolDisplayName', { nullable: true }),
      toolName: t.exposeString('toolName'),
      userId: t.exposeString('userId'),
      taskId: t.exposeString('taskId', { nullable: true }),
      commentId: t.exposeString('commentId', { nullable: true }),
      agentId: t.exposeString('agentId'),
      status: t.exposeString('status'),
      startedAt: t.exposeString('startedAt'),
      endedAt: t.exposeString('endedAt', { nullable: true }),
      durationMs: t.exposeInt('durationMs', { nullable: true }),
      inputTruncated: t.exposeBoolean('inputTruncated'),
      errorMessage: t.exposeString('errorMessage', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });
};

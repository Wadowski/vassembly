import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlTaskCommentSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'TaskComment',
    fields: (t) => ({
      taskId: t.exposeString('taskId'),
      userId: t.exposeString('userId'),
      userText: t.exposeString('userText'),
      agentResponse: t.exposeString('agentResponse', { nullable: true }),
    }),
  });
};

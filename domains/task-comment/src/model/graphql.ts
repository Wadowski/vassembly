import { defineModelSchema, graphQLListType } from '@vassembly/graphql';
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
      specializationIds: t.exposeStringList('specializationIds'),
      skillIdsUsed: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { skillIdsUsed?: string[] | null }) => parent.skillIdsUsed ?? null,
      }),
      taskPlanInstanceId: t.exposeString('taskPlanInstanceId', { nullable: true }),
    }),
  });
};

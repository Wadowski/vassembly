import { defineModelSchema, defineObjectType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlTaskQuestionsSchema = (builder: Builder): void => {
  defineObjectType(builder, 'PendingQuestion', {
    fields: (t) => ({
      questionId: t.exposeString('questionId'),
      commentId: t.exposeString('commentId'),
      invocationId: t.exposeString('invocationId'),
      askedByAgentId: t.exposeString('askedByAgentId'),
      askedByAgentType: t.exposeString('askedByAgentType'),
      question: t.exposeString('question'),
      inputType: t.exposeString('inputType'),
      options: t.stringList({ nullable: true, resolve: (q) => q.options ?? null }),
      askedAt: t.exposeString('askedAt'),
    }),
  });

  defineObjectType(builder, 'AnsweredQuestion', {
    fields: (t) => ({
      questionId: t.exposeString('questionId'),
      commentId: t.exposeString('commentId'),
      invocationId: t.exposeString('invocationId'),
      askedByAgentId: t.exposeString('askedByAgentId'),
      askedByAgentType: t.exposeString('askedByAgentType'),
      question: t.exposeString('question'),
      inputType: t.exposeString('inputType'),
      options: t.stringList({ nullable: true, resolve: (q) => q.options ?? null }),
      answer: t.exposeString('answer'),
      askedAt: t.exposeString('askedAt'),
      answeredAt: t.exposeString('answeredAt'),
    }),
  });

  defineModelSchema({
    builder,
    name: 'TaskQuestions',
    fields: (t) => ({
      taskId: t.exposeString('taskId'),
      pendingQuestions: t.field({
        type: ['PendingQuestion'],
        resolve: (parent) => parent.pendingQuestions ?? [],
      }),
      answeredQuestions: t.field({
        type: ['AnsweredQuestion'],
        resolve: (parent) => parent.answeredQuestions ?? [],
      }),
    }),
  });
};

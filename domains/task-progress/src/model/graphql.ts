import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';

import type { Builder } from '@vassembly/graphql';

export const gqlTaskProgressSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'TaskProgress',
    fields: (t) => ({
      taskId: t.exposeString('taskId'),
      startedAt: t.exposeString('startedAt'),
      completedAt: t.exposeString('completedAt', { nullable: true }),
      totalDuration: t.exposeInt('totalDuration'),
      totalTokens: t.expose('totalTokens', { type: 'TokenUsage' }),
      executionAttempt: t.exposeInt('executionAttempt'),
      events: t.field({
        type: graphQLListType('ProgressEvent'),
        resolve: (parent) => parent.events ?? [],
      }),
    }),
  });

  defineObjectType(builder, 'ProgressEvent', {
    fields: (t) => ({
      id: t.exposeString('id'),
      agentId: t.exposeString('agentId'),
      agentName: t.exposeString('agentName', { nullable: true }),
      parentAgentId: t.exposeString('parentAgentId', { nullable: true }),
      state: t.exposeString('state'),
      timestamp: t.exposeString('timestamp'),
      duration: t.exposeInt('duration', { nullable: true }),
      inputMessages: t.exposeString('inputMessages', { nullable: true }),
      generatedResponse: t.exposeString('generatedResponse', { nullable: true }),
      tokenUsage: t.expose('tokenUsage', { type: 'TokenUsage', nullable: true }),
      errorDetails: t.expose('errorDetails', { type: 'ErrorDetails', nullable: true }),
      integrationName: t.exposeString('integrationName', { nullable: true }),
      provider: t.exposeString('provider', { nullable: true }),
      model: t.exposeString('model', { nullable: true }),
    }),
  });

  defineObjectType(builder, 'TokenUsage', {
    fields: (t) => ({
      input: t.exposeInt('input'),
      output: t.exposeInt('output'),
      total: t.exposeInt('total'),
    }),
  });

  defineObjectType(builder, 'ErrorDetails', {
    fields: (t) => ({
      message: t.exposeString('message'),
      type: t.exposeString('type', { nullable: true }),
      stackTrace: t.exposeString('stackTrace', { nullable: true }),
    }),
  });
};

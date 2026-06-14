import { defineModelSchema, defineObjectType, graphQLListType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlAiIntegrationSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'AiIntegrationCredential',
    fields: (t) => ({
      userId: t.exposeString('userId', { nullable: true }),
      name: t.exposeString('name', { nullable: true }),
      provider: t.exposeString('provider', { nullable: true }),
      hasApiKey: t.exposeBoolean('hasApiKey', { nullable: true }),
      apiKeyHint: t.exposeString('apiKeyHint', { nullable: true }),
      baseUrl: t.exposeString('baseUrl', { nullable: true }),
      organizationId: t.exposeString('organizationId', { nullable: true }),
      status: t.exposeString('status', { nullable: true }),
      connectionStatus: t.exposeString('connectionStatus', { nullable: true }),
      lastTestedAt: t.exposeString('lastTestedAt', { nullable: true }),
      lastConnectionError: t.exposeString('lastConnectionError', { nullable: true }),
      model: t.exposeString('model', { nullable: true }),
      agentUsageCount: t.exposeInt('agentUsageCount', { nullable: true }),
    }),
  });

  defineObjectType(builder, 'AiIntegrationCredentialsList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('AiIntegrationCredential'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      totalCount: t.exposeInt('totalCount'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

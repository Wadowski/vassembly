import { defineModelSchema, defineObjectType, graphQLListType, graphQLType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const gqlMcpSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'Mcp',
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      description: t.exposeString('description'),
      tags: t.exposeStringList('tags'),
      iconPath: t.exposeString('iconPath'),
      slug: t.exposeString('slug'),
      documentationUrl: t.exposeString('documentationUrl', { nullable: true }),
      repositoryUrl: t.exposeString('repositoryUrl', { nullable: true }),
      configurationStatus: t.exposeString('configurationStatus', { nullable: true }),
      enabled: t.exposeBoolean('enabled', { nullable: true }),
      requiresConfiguration: t.exposeBoolean('requiresConfiguration', { nullable: true }),
      agentUsageCount: t.exposeInt('agentUsageCount', { nullable: true }),
      specializationIds: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { specializationIds?: string[] }) => parent.specializationIds ?? null,
      }),
      configSchema: t.field({
        type: graphQLType('ConfigSchema'),
        nullable: true,
        resolve: (parent) => parent.configSchema ?? null,
      }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  defineObjectType(builder,'McpsList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('Mcp'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });

  defineObjectType(builder,'AvailableTags', {
    fields: (t) => ({
      tags: t.exposeStringList('tags'),
    }),
  });

  defineObjectType(builder,'UserMcpConfigFieldValue', {
    fields: (t) => ({
      key: t.exposeString('key'),
      value: t.field({
        type: graphQLType('String'),
        nullable: true,
        resolve: (parent: { value?: string | boolean }) => {
          if (parent.value === undefined) {
            return null;
          }

          if (typeof parent.value === 'boolean') {
            return String(parent.value);
          }

          return parent.value;
        },
      }),
      hasSecret: t.exposeBoolean('hasSecret', { nullable: true }),
    }),
  });

  defineObjectType(builder,'UserMcpConfig', {
    fields: (t) => ({
      id: t.exposeString('id'),
      userId: t.exposeString('userId'),
      mcpId: t.exposeString('mcpId'),
      status: t.exposeString('status'),
      enabled: t.exposeBoolean('enabled'),
      lastTestedAt: t.exposeString('lastTestedAt', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
      fieldValues: t.field({
        type: graphQLListType('UserMcpConfigFieldValue'),
        resolve: (parent: { fieldValues: unknown[] }) => parent.fieldValues,
      }),
    }),
  });

  defineObjectType(builder,'UserMcpConfigList', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('UserMcpConfig'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
    }),
  });

  defineObjectType(builder,'McpWithAgents', {
    fields: (t) => ({
      mcp: t.field({
        type: graphQLType('Mcp'),
        resolve: (parent) => parent.mcp,
      }),
      agents: t.field({
        type: graphQLListType('Agent'),
        resolve: (parent: { agents: unknown[] }) => parent.agents,
      }),
      totalCount: t.exposeInt('totalCount'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
      configurationStatus: t.exposeString('configurationStatus', { nullable: true }),
      agentUsageCount: t.exposeInt('agentUsageCount', { nullable: true }),
    }),
  });

  defineObjectType(builder,'ConfigSchemaFieldOption', {
    fields: (t) => ({
      value: t.exposeString('value'),
      label: t.exposeString('label'),
    }),
  });

  defineObjectType(builder,'ConfigSchemaField', {
    fields: (t) => ({
      key: t.exposeString('key'),
      label: t.exposeString('label'),
      type: t.exposeString('type'),
      description: t.exposeString('description', { nullable: true }),
      required: t.exposeBoolean('required', { nullable: true }),
      defaultValue: t.exposeString('defaultValue', { nullable: true }),
      placeholder: t.exposeString('placeholder', { nullable: true }),
      format: t.exposeString('format', { nullable: true }),
      pattern: t.exposeString('pattern', { nullable: true }),
      minLength: t.exposeInt('minLength', { nullable: true }),
      maxLength: t.exposeInt('maxLength', { nullable: true }),
      options: t.field({
        type: graphQLListType('ConfigSchemaFieldOption'),
        nullable: true,
        resolve: (parent: { options?: unknown[] }) => parent.options,
      }),
    }),
  });

  defineObjectType(builder,'ConfigSchema', {
    fields: (t) => ({
      fields: t.field({
        type: graphQLListType('ConfigSchemaField'),
        resolve: (parent: { fields: unknown[] }) => parent.fields,
      }),
    }),
  });
};

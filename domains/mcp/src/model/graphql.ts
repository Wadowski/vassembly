import { defineModelSchema } from '@vassembly/graphql';
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
      agentUsageCount: t.exposeInt('agentUsageCount', { nullable: true }),
      configSchema: t.field({
        type: 'ConfigSchema',
        nullable: true,
        resolve: (parent: { configSchema?: unknown }) => parent.configSchema,
      }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  builder.objectType('McpsList', {
    fields: (t) => ({
      items: t.field({
        type: ['Mcp'],
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });

  builder.objectType('AvailableTags', {
    fields: (t) => ({
      tags: t.exposeStringList('tags'),
    }),
  });

  builder.objectType('UserMcpConfigFieldValue', {
    fields: (t) => ({
      key: t.exposeString('key'),
      value: t.field({
        type: 'String',
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

  builder.objectType('UserMcpConfig', {
    fields: (t) => ({
      id: t.exposeString('id'),
      userId: t.exposeString('userId'),
      mcpId: t.exposeString('mcpId'),
      status: t.exposeString('status'),
      lastTestedAt: t.exposeString('lastTestedAt', { nullable: true }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
      fieldValues: t.field({
        type: ['UserMcpConfigFieldValue'],
        resolve: (parent: { fieldValues: unknown[] }) => parent.fieldValues,
      }),
    }),
  });

  builder.objectType('UserMcpConfigList', {
    fields: (t) => ({
      items: t.field({
        type: ['UserMcpConfig'],
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
    }),
  });

  builder.objectType('McpWithAgents', {
    fields: (t) => ({
      mcp: t.field({
        type: 'Mcp',
        resolve: (parent: { mcp: unknown }) => parent.mcp,
      }),
      agents: t.field({
        type: ['Agent'],
        resolve: (parent: { agents: unknown[] }) => parent.agents,
      }),
      totalCount: t.exposeInt('totalCount'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
      configurationStatus: t.exposeString('configurationStatus', { nullable: true }),
      agentUsageCount: t.exposeInt('agentUsageCount', { nullable: true }),
    }),
  });

  builder.objectType('ConfigSchemaFieldOption', {
    fields: (t) => ({
      value: t.exposeString('value'),
      label: t.exposeString('label'),
    }),
  });

  builder.objectType('ConfigSchemaField', {
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
        type: ['ConfigSchemaFieldOption'],
        nullable: true,
        resolve: (parent: { options?: unknown[] }) => parent.options,
      }),
    }),
  });

  builder.objectType('ConfigSchema', {
    fields: (t) => ({
      fields: t.field({
        type: ['ConfigSchemaField'],
        resolve: (parent: { fields: unknown[] }) => parent.fields,
      }),
    }),
  });
};

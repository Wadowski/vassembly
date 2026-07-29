import type SchemaBuilder from '@pothos/core';
import type { GraphQLSchema } from 'graphql';

export type GraphQLSchemaTypes = {
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
  Objects: Record<string, object>;
  Queries: Record<string, { Args: Record<string, unknown>; Output: unknown }>;
  Mutations: Record<string, { Args: Record<string, unknown>; Output: unknown }>;
};

export type Builder = InstanceType<typeof SchemaBuilder<GraphQLSchemaTypes>>;

type ObjectTypeOptionsParam = Parameters<Builder['objectType']>[1];

type ObjectFieldsFn = NonNullable<ObjectTypeOptionsParam['fields']>;

export type GraphQLFieldBuilder =
  ObjectFieldsFn extends (t: infer FieldBuilder) => unknown ? FieldBuilder : never;

type QueryFieldsCallback = Parameters<Builder['queryFields']>[0];

type MutationFieldsCallback = Parameters<Builder['mutationFields']>[0];

export type GraphQLQueryFieldBuilder = QueryFieldsCallback extends (
  t: infer FieldBuilder,
) => unknown
  ? FieldBuilder
  : never;

export type GraphQLMutationFieldBuilder = MutationFieldsCallback extends (
  t: infer FieldBuilder,
) => unknown
  ? FieldBuilder
  : never;

export interface DefineModelSchemaProps {
  builder: Builder;
  name: string;
  fields: (t: GraphQLFieldBuilder) => Record<string, unknown>;
  includeCommonFields?: boolean;
}

export interface ApplyResolversProps {
  builder: Builder;
  queries?: QueryFieldsCallback;
  mutations?: MutationFieldsCallback;
}

export interface BuildGraphQLConfigProps {
  builder: Builder;
  path?: string;
}

export interface GraphQLConfigResult {
  schema: GraphQLSchema;
  path?: string;
}

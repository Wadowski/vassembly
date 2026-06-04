import type SchemaBuilder from '@pothos/core';
import type { GraphQLSchema } from 'graphql';

export type Builder = InstanceType<
  typeof SchemaBuilder<
    Record<string, unknown> & {
      Scalars: {
        DateTime: { Input: Date; Output: Date };
      };
    }
  >
>;


export interface DefineModelSchemaProps<T extends object = object> {
  builder: Builder;
  name: string;
  fields: (t: any) => Record<string, unknown>;
  includeCommonFields?: boolean;
}

export interface ApplyResolversProps {
  builder: Builder;
  queries?: (t: any) => Record<string, unknown>;
  mutations?: (t: any) => Record<string, unknown>;
}

export interface BuildGraphQLConfigProps {
  builder: Builder;
  path?: string;
}

export interface GraphQLConfigResult {
  schema: GraphQLSchema;
  path?: string;
}

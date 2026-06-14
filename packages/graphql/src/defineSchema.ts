import type { Builder, DefineModelSchemaProps, GraphQLFieldBuilder } from './types';

type ObjectFieldsFn = NonNullable<Parameters<Builder['objectType']>[1]['fields']>;

type ObjectFieldsReturn = ReturnType<ObjectFieldsFn>;

const getCommonFields = (t: GraphQLFieldBuilder): ObjectFieldsReturn => ({
  id: t.exposeID('id', { nullable: true }),
  createdAt: t.expose('createdAt', { type: 'DateTime', nullable: true }),
  updatedAt: t.expose('updatedAt', { type: 'DateTime', nullable: true }),
  removedAt: t.expose('removedAt', { type: 'DateTime', nullable: true }),
});

type ObjectTypeRef = Parameters<Builder['objectType']>[0];

type OutputTypeRef = ObjectTypeRef | 'String' | 'Boolean' | 'Int';

export const graphQLListType = <T extends string>(typeName: T): [OutputTypeRef] =>
  [typeName] as unknown as [OutputTypeRef];

export const graphQLType = <T extends string>(typeName: T): OutputTypeRef =>
  typeName as unknown as OutputTypeRef;

export const defineObjectType = (
  builder: Builder,
  name: string,
  config: Parameters<Builder['objectType']>[1],
): void => {
  builder.objectType(name as unknown as Parameters<Builder['objectType']>[0], config);
};

export const defineModelSchema = ({
  builder,
  name,
  fields,
  includeCommonFields = true,
}: DefineModelSchemaProps & { includeCommonFields?: boolean }): void => {
  builder.objectType(name as unknown as Parameters<Builder['objectType']>[0], {
    fields: (t) => {
      const commonFields = includeCommonFields ? getCommonFields(t) : {};
      const domainFields = fields(t);
      return {
        ...commonFields,
        ...domainFields,
      } as ObjectFieldsReturn;
    },
  });
};

export { getCommonFields };

import type { DefineModelSchemaProps } from './types';

const getCommonFields = (t: any) => ({
  id: t.exposeID('id', { nullable: true }),
  createdAt: t.expose('createdAt', { type: 'DateTime', nullable: true }),
  updatedAt: t.expose('updatedAt', { type: 'DateTime', nullable: true }),
  removedAt: t.expose('removedAt', { type: 'DateTime', nullable: true }),
});

export const defineModelSchema = <T extends object = object>({
  builder,
  name,
  fields,
  includeCommonFields = true,
}: DefineModelSchemaProps<T> & { includeCommonFields?: boolean }): void => {
  builder.objectType(name as any, {
    fields: (t: any) => {
      const commonFields = includeCommonFields ? getCommonFields(t) : {};
      const domainFields = fields(t);
      return {
        ...commonFields,
        ...domainFields,
      };
    },
  });
};

export { getCommonFields };

import { defineModelSchema, defineObjectType, graphQLListType, graphQLType } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

import { SKILL_SCRIPT_LANGUAGES } from '../constants';

export const gqlSkillSchema = (builder: Builder): void => {
  builder.enumType('SkillScriptLanguage', {
    values: SKILL_SCRIPT_LANGUAGES,
  });

  defineObjectType(builder, 'SkillScript', {
    fields: (t) => ({
      filename: t.exposeString('filename'),
      language: t.field({
        type: graphQLType('SkillScriptLanguage'),
        resolve: (parent: { language: string }) => parent.language,
      }),
    }),
  });

  defineModelSchema({
    builder,
    name: 'Skill',
    includeCommonFields: false,
    fields: (t) => ({
      id: t.exposeString('id'),
      specializationId: t.exposeString('specializationId'),
      name: t.exposeString('name'),
      description: t.exposeString('description'),
      rule: t.exposeString('rule'),
      scripts: t.field({
        type: graphQLListType('SkillScript'),
        resolve: (parent: { scripts: unknown[] }) => parent.scripts,
      }),
      createdAt: t.exposeString('createdAt'),
      updatedAt: t.exposeString('updatedAt'),
    }),
  });

  defineObjectType(builder, 'SkillPage', {
    fields: (t) => ({
      items: t.field({
        type: graphQLListType('Skill'),
        resolve: (parent: { items: unknown[] }) => parent.items,
      }),
      total: t.exposeInt('total'),
      page: t.exposeInt('page'),
      size: t.exposeInt('size'),
    }),
  });
};

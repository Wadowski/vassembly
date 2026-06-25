import { assertRequiredFields, toIsoString } from '@vassembly/mappers';

import type { SkillResponse } from './dto';
import type { SkillModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'specializationId',
  'name',
  'description',
  'rule',
  'scripts',
  'createdAt',
  'updatedAt',
] as const;

export interface ToSkillResponseParams {
  skill: SkillModel;
}

export const toSkillResponse = ({ skill }: ToSkillResponseParams): SkillResponse => {
  assertRequiredFields({
    entity: skill,
    fields: REQUIRED_FIELDS,
    entityName: 'Skill',
  });

  return {
    id: skill.id!,
    specializationId: skill.specializationId!,
    name: skill.name!,
    description: skill.description!,
    rule: skill.rule!,
    scripts: (skill.scripts ?? []).map((script) => ({
      filename: script.filename,
      language: script.language,
    })),
    createdAt: toIsoString({ value: skill.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: skill.updatedAt!, fieldName: 'updatedAt' }),
  };
};

import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { SkillResponse } from './dto';
import type { SkillModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'specializationId',
  'name',
  'description',
  'rule',
  'enabled',
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
    enabled: skill.enabled ?? true,
    scripts: (skill.scripts ?? []).map((script) => ({
      filename: script.filename,
      language: script.language,
    })),
    usesSkillIds: skill.usesSkillIds ?? [],
    createdAt: toIsoString({ value: skill.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: skill.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(skill.removedAt),
  };
};

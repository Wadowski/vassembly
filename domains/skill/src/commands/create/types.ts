import type { SkillModel } from '../../model';

import type { SkillDuplicateBehavior, SkillScriptInput } from '../shared/types';

export interface CreateSkillCommandInput {
  specializationId: string;
  name: string;
  description: string;
  input: string;
  output: string;
  rule: string;
  scripts?: SkillScriptInput[];
  usesSkillIds?: string[];
  onDuplicate?: SkillDuplicateBehavior;
}

export interface CreateSkillCommandResult {
  data: SkillModel;
  isNew: boolean;
}

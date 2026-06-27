import type { SkillModel } from '../../model';

import type { SkillDuplicateBehavior, SkillScriptInput } from '../shared/types';

export interface CreateSkillCommandInput {
  specializationId: string;
  name: string;
  description: string;
  rule: string;
  scripts?: SkillScriptInput[];
  onDuplicate?: SkillDuplicateBehavior;
}

export interface CreateSkillCommandResult {
  data: SkillModel;
  isNew: boolean;
}

import { Model } from '@vassembly/model';

import type { SkillScript } from './types';

export class SkillModel extends Model {
  specializationId!: string;
  name!: string;
  description!: string;
  input?: string;
  output?: string;
  rule!: string;
  enabled!: boolean;
  scripts!: SkillScript[];
  usesSkillIds?: string[];
}

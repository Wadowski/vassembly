import { Model } from '@vassembly/model';

import type { SkillScript } from './types';

export class SkillModel extends Model {
  specializationId!: string;
  name!: string;
  description!: string;
  rule!: string;
  scripts!: SkillScript[];
}

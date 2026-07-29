import { Model } from '@vassembly/model';

export interface TaskPlanTemplateItem {
  agentId: string;
  skillId: string | null;
  description: string;
  order: number;
}

export class TaskPlanTemplateModel extends Model {
  shortName?: string;
  description?: string;
  normalizedDescriptionHash?: string;
  inputDetails?: Record<string, unknown>;
  outputDetails?: Record<string, unknown>;
  items?: TaskPlanTemplateItem[];
}

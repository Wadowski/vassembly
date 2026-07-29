import type { TaskPlanTemplateModel } from '../../model';

export interface FindEquivalentParams {
  shortName: string;
  normalizedDescriptionHash: string;
}

export interface FindEquivalentResult {
  data: TaskPlanTemplateModel | null;
}

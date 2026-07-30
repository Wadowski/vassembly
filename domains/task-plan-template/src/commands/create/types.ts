import type { TaskPlanTemplateItem } from '../../model';

export interface CreateTaskPlanTemplateCommandInput {
  shortName: string;
  description: string;
  inputDetails: Record<string, unknown>;
  outputDetails: Record<string, unknown>;
  items: TaskPlanTemplateItem[];
}

export interface CreateTaskPlanTemplateCommandResult {
  data: {
    id?: string;
    shortName?: string;
    description?: string;
    normalizedDescriptionHash?: string;
    inputDetails?: Record<string, unknown>;
    outputDetails?: Record<string, unknown>;
    items?: TaskPlanTemplateItem[];
  };
}

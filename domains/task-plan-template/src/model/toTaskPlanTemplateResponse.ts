import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { TaskPlanTemplateResponse } from './dto';
import type { TaskPlanTemplateModel } from './model';

const REQUIRED_FIELDS = ['id', 'shortName', 'description', 'createdAt', 'updatedAt'] as const;

export interface ToTaskPlanTemplateResponseParams {
  taskPlanTemplate: TaskPlanTemplateModel;
}

export const toTaskPlanTemplateResponse = ({
  taskPlanTemplate,
}: ToTaskPlanTemplateResponseParams): TaskPlanTemplateResponse => {
  assertRequiredFields({
    entity: taskPlanTemplate,
    fields: REQUIRED_FIELDS,
    entityName: 'Task plan template',
  });

  return {
    id: taskPlanTemplate.id!,
    shortName: taskPlanTemplate.shortName!,
    description: taskPlanTemplate.description!,
    inputDetails: taskPlanTemplate.inputDetails ?? {},
    outputDetails: taskPlanTemplate.outputDetails ?? {},
    items: (taskPlanTemplate.items ?? []).map((item) => ({
      agentId: item.agentId,
      skillId: item.skillId,
      description: item.description,
      order: item.order,
    })),
    createdAt: toIsoString({ value: taskPlanTemplate.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: taskPlanTemplate.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(taskPlanTemplate.removedAt),
  };
};

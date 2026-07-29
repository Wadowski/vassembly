import { createDb } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanTemplateMongodbDao } from '../../clients';
import { TaskPlanTemplateModel, taskPlanTemplateFactory } from '../../model';
import { normalizeDescriptionHash } from '../../queries/shared/normalizeDescriptionHash';
import {
  MAX_JSON_BYTES,
  TASK_PLAN_TEMPLATE_ITEMS_SCHEMA,
} from '../shared/schemas';

import type { CreateTaskPlanTemplateCommandInput, CreateTaskPlanTemplateCommandResult } from './types';

const CREATE_INPUT_SCHEMA = z.object({
  shortName: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  inputDetails: z.record(z.string(), z.unknown()),
  outputDetails: z.record(z.string(), z.unknown()),
  items: TASK_PLAN_TEMPLATE_ITEMS_SCHEMA,
});

const CREATE_DB_SCHEMA = z.object({
  shortName: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  normalizedDescriptionHash: z.string().min(1),
  inputDetails: z.record(z.string(), z.unknown()),
  outputDetails: z.record(z.string(), z.unknown()),
  items: TASK_PLAN_TEMPLATE_ITEMS_SCHEMA,
});

const assertJsonSize = ({
  label,
  value,
}: {
  label: string;
  value: Record<string, unknown>;
}): void => {
  if (JSON.stringify(value).length > MAX_JSON_BYTES) {
    throw new ValidationError(`${label} exceeds maximum size of ${MAX_JSON_BYTES} bytes`);
  }
};

const persistCreate = createDb<TaskPlanTemplateModel>({
  dao: taskPlanTemplateMongodbDao,
  factory: taskPlanTemplateFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

export const create = async (
  input: CreateTaskPlanTemplateCommandInput,
): Promise<CreateTaskPlanTemplateCommandResult> => {
  const parsed = CREATE_INPUT_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  assertJsonSize({ label: 'inputDetails', value: parsed.data.inputDetails });
  assertJsonSize({ label: 'outputDetails', value: parsed.data.outputDetails });

  const normalizedDescriptionHash = normalizeDescriptionHash({
    description: parsed.data.description,
  });

  return persistCreate({
    ...parsed.data,
    normalizedDescriptionHash,
  });
};

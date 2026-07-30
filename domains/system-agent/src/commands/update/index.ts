import { updateDbById } from '@vassembly/commands';
import { z } from 'zod';

import { validatorFactory } from '@vassembly/validation';

import { AgentCategory, AgentStatus, SYSTEM_AGENT_CUSTOM_INSTRUCTIONS_MAX_LENGTH } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { SystemAgentModel, systemAgentFactory } from '../../model';
import { invalidateActiveByNameCache } from '../../cache/keys';
import { assertUniqueActiveName, getModelById } from '../../queries';

import { assertValidInput } from '../shared/assertValidInput';
import { assignedToolIdsUpdateSchema } from '../shared/assignedToolIdsSchema';
import { UPDATE_SYSTEM_AGENT_SCHEMA } from '../shared/schemas';

import type { UpdateSystemAgentParams, UpdateSystemAgentResult } from './types';

const validateUpdateInput = validatorFactory(UPDATE_SYSTEM_AGENT_SCHEMA);

const UPDATE_DB_SCHEMA = z
  .object({
    name: z.string().min(1).max(100).optional(),
    rule: z.string().min(1).max(5000).optional(),
    description: z.string().max(500).nullable().optional(),
    category: z.enum(Object.values(AgentCategory) as [string, ...string[]]).nullable().optional(),
    status: z.enum(Object.values(AgentStatus) as [string, ...string[]]).optional(),
    assignedToolIds: assignedToolIdsUpdateSchema,
    customInstructions: z.string().max(SYSTEM_AGENT_CUSTOM_INSTRUCTIONS_MAX_LENGTH).nullable().optional(),
    updatedByAdminId: z.string().min(1),
  });

const persistUpdate = updateDbById<SystemAgentModel>({
  dao: systemAgentMongodbDao,
  factory: systemAgentFactory,
  validationSchema: UPDATE_DB_SCHEMA,
});

export const update = async (
  input: UpdateSystemAgentParams,
): Promise<UpdateSystemAgentResult> => {
  const validated = assertValidInput(validateUpdateInput(input));
  const existing = await getModelById({ id: validated.id });
  const previousName = existing.data?.name;

  if (validated.data.name !== undefined) {
    await assertUniqueActiveName({
      name: validated.data.name,
      excludeId: validated.id,
    });
  }

  const updateData: Partial<SystemAgentModel> & { updatedByAdminId: string } = {
    ...validated.data as Partial<SystemAgentModel>,
    updatedByAdminId: validated.updatedByAdminId,
  };

  const result = await persistUpdate({
    id: validated.id,
    data: updateData,
  });

  if (previousName) {
    await invalidateActiveByNameCache({ name: previousName });
  }
  if (validated.data.name !== undefined) {
    await invalidateActiveByNameCache({ name: validated.data.name });
  }

  return result;
};

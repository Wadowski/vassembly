import { updateDbById } from '@vassembly/commands';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { AgentModel, agentFactory } from '../../model';
import { AgentCategory, AgentStatus } from '../../constants';

import { assertValidInput } from '../shared/assertValidInput';
import { assignedMcpIdsUpdateSchema } from '../shared/assignedMcpIdsSchema';
import { assignedToolIdsUpdateSchema } from '../shared/assignedToolIdsSchema';

const UPDATE_DB_SCHEMA = z
  .object({
    name: z.string().max(100).optional(),
    category: z.enum(Object.values(AgentCategory) as [string, ...string[]]).optional(),
    description: z.string().max(500).optional(),
    rule: z.string().max(2000).optional(),
    status: z.enum(Object.values(AgentStatus) as [string, ...string[]]).optional(),
    integrationCredentialId: z.string().optional(),
    assignedMcpIds: assignedMcpIdsUpdateSchema,
    assignedToolIds: assignedToolIdsUpdateSchema,
  })
  .strict();

const validateUpdateData = validatorFactory(UPDATE_DB_SCHEMA);

const persistUpdate = updateDbById<AgentModel>({
  dao: agentMongodbDao,
  factory: agentFactory,
  validationSchema: UPDATE_DB_SCHEMA,
});

export const update = async (input: Parameters<typeof persistUpdate>[0]) => {
  const validated = assertValidInput(validateUpdateData(input.data));
  const result = await persistUpdate(input);
  const { data } = result;

  if (validated.assignedMcpIds !== undefined) {
    data.assignedMcpIds = data.assignedMcpIds ?? validated.assignedMcpIds;
  }

  if (validated.assignedToolIds !== undefined) {
    data.assignedToolIds = data.assignedToolIds ?? validated.assignedToolIds;
  }

  return { data };
};

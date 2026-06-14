import { createDb } from '@vassembly/commands';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { AgentModel, agentFactory, AgentCategory, AgentStatus } from '../../model';

import { assertValidInput } from '../shared/assertValidInput';
import { assignedMcpIdsCreateSchema } from '../shared/assignedMcpIdsSchema';
import { assignedToolIdsCreateSchema } from '../shared/assignedToolIdsSchema';
import type { CreateAgentCommandInput } from './types';

const CREATE_SCHEMA = z.object({
  userId: z.string().min(1),
  name: z.string().max(100),
  category: z.enum(Object.values(AgentCategory) as [string, ...string[]]),
  description: z.string().max(500),
  rule: z.string().max(2000),
  status: z.enum(Object.values(AgentStatus) as [string, ...string[]]),
  integrationCredentialId: z.string().optional(),
  assignedMcpIds: assignedMcpIdsCreateSchema,
  assignedToolIds: assignedToolIdsCreateSchema,
  removedAt: z.null().default(null),
});

const validateCreateInput = validatorFactory(CREATE_SCHEMA);

const createDbAgent = createDb<AgentModel>({
  dao: agentMongodbDao,
  factory: agentFactory,
  validationSchema: CREATE_SCHEMA,
});

export const create = async (input: CreateAgentCommandInput) => {
  const payload = {
    ...input,
    status: input.status ?? AgentStatus.Active,
  };
  const validated = assertValidInput(validateCreateInput(payload));

  const result = await createDbAgent({
    ...validated,
    category: validated.category as AgentCategory,
    status: validated.status as AgentStatus,
  });

  const { data } = result;
  data.assignedMcpIds = data.assignedMcpIds ?? validated.assignedMcpIds;
  data.assignedToolIds = data.assignedToolIds ?? validated.assignedToolIds;

  return { data };
};

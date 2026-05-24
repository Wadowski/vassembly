import { createDb } from '@vassembly/commands';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { AgentModel, agentFactory, AgentCategory, AgentStatus } from '../../model';

import type { CreateAgentCommandInput } from './types';

const CREATE_SCHEMA = z.object({
  userId: z.string().min(1),
  name: z.string().max(100),
  category: z.enum(Object.values(AgentCategory) as [string, ...string[]]),
  description: z.string().max(500),
  rule: z.string().max(2000),
  status: z.enum(Object.values(AgentStatus) as [string, ...string[]]),
  integrationCredentialId: z.string().optional(),
  removedAt: z.null().default(null),
});

const createDbAgent = createDb<AgentModel>({
  dao: agentMongodbDao,
  factory: agentFactory,
  validationSchema: CREATE_SCHEMA,
});

export const create = async (input: CreateAgentCommandInput) => {
  return createDbAgent({
    ...input,
    status: input.status ?? AgentStatus.Active,
  });
};

import { updateDbById } from '@vassembly/commands';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { AgentModel, agentFactory } from '../../model';
import { AgentCategory, AgentStatus } from '../../constants';

const UPDATE_DB_SCHEMA = z.object({
  name: z.string().max(100).optional(),
  category: z.enum(Object.values(AgentCategory) as [string, ...string[]]).optional(),
  description: z.string().max(500).optional(),
  rule: z.string().max(2000).optional(),
  status: z.enum(Object.values(AgentStatus) as [string, ...string[]]).optional(),
});

export const update = updateDbById<AgentModel>({
  dao: agentMongodbDao,
  factory: agentFactory,
  validationSchema: UPDATE_DB_SCHEMA,
});

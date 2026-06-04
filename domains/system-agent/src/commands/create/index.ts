import { createDb } from '@vassembly/commands';
import { z } from 'zod';

import { validatorFactory } from '@vassembly/validation';

import { AgentCategory, AgentStatus, SYSTEM_AGENT_DEFAULT_STATUS } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { SystemAgentModel, systemAgentFactory } from '../../model';
import { invalidateActiveByNameCache } from '../../cache/keys';
import { assertUniqueActiveName } from '../../queries';

import { assertValidInput } from '../shared/assertValidInput';
import { CREATE_SYSTEM_AGENT_SCHEMA } from '../shared/schemas';

import type { CreateSystemAgentParams, CreateSystemAgentResult } from './types';

const validateCreateInput = validatorFactory(CREATE_SYSTEM_AGENT_SCHEMA);

const CREATE_DB_SCHEMA = z.object({
  name: z.string().min(1).max(100),
  rule: z.string().min(1).max(5000),
  description: z.string().max(500).optional(),
  category: z.enum(Object.values(AgentCategory) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(AgentStatus) as [string, ...string[]]),
  createdByAdminId: z.string().min(1),
  updatedByAdminId: z.string().min(1),
  removedAt: z.null().default(null),
});

const persistCreate = createDb<SystemAgentModel>({
  dao: systemAgentMongodbDao,
  factory: systemAgentFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

export const create = async (
  input: CreateSystemAgentParams,
): Promise<CreateSystemAgentResult> => {
  const validated = assertValidInput(validateCreateInput(input));
  const updatedByAdminId = validated.updatedByAdminId ?? validated.createdByAdminId;

  await assertUniqueActiveName({ name: validated.name });

  const result = await persistCreate({
    name: validated.name,
    rule: validated.rule,
    description: validated.description,
    category: validated.category,
    status: SYSTEM_AGENT_DEFAULT_STATUS,
    createdByAdminId: validated.createdByAdminId,
    updatedByAdminId,
    removedAt: null,
  });

  await invalidateActiveByNameCache({ name: validated.name });

  return result;
};

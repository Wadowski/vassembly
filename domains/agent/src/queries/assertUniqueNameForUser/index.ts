import { ObjectId } from 'mongodb';

import { ConflictError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { assertValidInput } from '../../commands/shared/assertValidInput';
import { ACTIVE_PERSONAL_AGENT_FILTER } from '../shared/activePersonalAgentFilter';
import { escapeRegex } from '../shared/escapeRegex';

import type { AssertUniqueNameForUserParams } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  excludeId: z.string().optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const CONFLICT_MESSAGE = 'Agent name already in use';

export const assertUniqueNameForUser = async (
  input: AssertUniqueNameForUserParams,
): Promise<void> => {
  const parsed = assertValidInput(validateQueryInput(input));

  const filter: Record<string, unknown> = {
    ...ACTIVE_PERSONAL_AGENT_FILTER,
    userId: parsed.userId,
    name: {
      $regex: `^${escapeRegex(parsed.name)}$`,
      $options: 'i',
    },
  };

  if (parsed.excludeId !== undefined) {
    filter._id = { $ne: new ObjectId(parsed.excludeId) };
  }

  const existing = await agentMongodbDao.getRaw(filter);

  if (existing) {
    throw new ConflictError(CONFLICT_MESSAGE);
  }
};

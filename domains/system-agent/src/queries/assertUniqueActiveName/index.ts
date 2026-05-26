import { ObjectId } from 'mongodb';

import { ConflictError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { SYSTEM_AGENT_NAME_MIN_LENGTH } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { assertValidInput } from '../../commands/shared/assertValidInput';
import { ACTIVE_SYSTEM_AGENT_FILTER } from '../shared/activeSystemAgentFilter';
import { escapeRegex } from '../shared/escapeRegex';

import type { AssertUniqueActiveNameParams } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  name: z.string().trim().min(SYSTEM_AGENT_NAME_MIN_LENGTH),
  excludeId: z.string().optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const CONFLICT_MESSAGE = 'System agent name already in use';

export const assertUniqueActiveName = async (
  input: AssertUniqueActiveNameParams,
): Promise<void> => {
  const parsed = assertValidInput(validateQueryInput(input));

  const filter: Record<string, unknown> = {
    ...ACTIVE_SYSTEM_AGENT_FILTER,
    name: {
      $regex: `^${escapeRegex(parsed.name)}$`,
      $options: 'i',
    },
  };

  if (parsed.excludeId !== undefined) {
    filter._id = { $ne: new ObjectId(parsed.excludeId) };
  }

  const existing = await systemAgentMongodbDao.getRaw(filter);

  if (existing) {
    throw new ConflictError(CONFLICT_MESSAGE);
  }
};

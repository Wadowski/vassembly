import { deserializeCacheValue, serializeCacheValue } from '@vassembly/cache';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { SYSTEM_AGENT_NAME_MIN_LENGTH } from '../../constants';
import { getSystemAgentCache, systemAgentMongodbDao } from '../../clients';
import { buildActiveByNameCacheKey } from '../../cache/keys';
import { systemAgentFactory } from '../../model';
import { throwSystemAgentNotFoundError } from '../../errors';
import { ACTIVE_SYSTEM_AGENT_FILTER } from '../shared/activeSystemAgentFilter';
import { escapeRegex } from '../shared/escapeRegex';

import type { CachedSystemAgentPayload } from '../../cache/types';
import type { GetActiveByNameParams, GetActiveByNameResult } from './types';
import type { SystemAgentModel } from '../../model';

const QUERY_INPUT_SCHEMA = z.object({
  name: z.string().trim().min(SYSTEM_AGENT_NAME_MIN_LENGTH),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const loadActiveByNameFromStore = async ({
  name,
}: {
  name: string;
}): Promise<SystemAgentModel> => {
  const filter: Record<string, unknown> = {
    ...ACTIVE_SYSTEM_AGENT_FILTER,
    name: {
      $regex: `^${escapeRegex(name)}$`,
      $options: 'i',
    },
  };

  const row = await systemAgentMongodbDao.getRaw(filter);

  if (!row) {
    throwSystemAgentNotFoundError();
  }

  return systemAgentFactory.create(row as Partial<SystemAgentModel>);
};

export const getActiveByName = async (
  input: GetActiveByNameParams,
): Promise<GetActiveByNameResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const cacheKey = buildActiveByNameCacheKey({ name: parsed.data.name });
  const cache = getSystemAgentCache();
  const cachedSerialized = await cache.get({ key: cacheKey });

  if (cachedSerialized !== null) {
    const cached = deserializeCacheValue<CachedSystemAgentPayload>({
      serialized: cachedSerialized,
    });
    return {
      data: systemAgentFactory.create(cached),
    };
  }

  const agent = await loadActiveByNameFromStore({ name: parsed.data.name });

  await cache.set({
    key: cacheKey,
    value: serializeCacheValue({ value: agent as CachedSystemAgentPayload }),
  });

  return {
    data: agent,
  };
};

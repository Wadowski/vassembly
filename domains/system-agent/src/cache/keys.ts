import { getSystemAgentCache } from '../clients/cache';

export const SYSTEM_AGENT_ACTIVE_BY_NAME_KEY_PREFIX = 'active-by-name';

export interface BuildActiveByNameCacheKeyParams {
  name: string;
}

export const buildActiveByNameCacheKey = ({
  name,
}: BuildActiveByNameCacheKeyParams): string =>
  `${SYSTEM_AGENT_ACTIVE_BY_NAME_KEY_PREFIX}:${name.trim().toLowerCase()}`;

export interface InvalidateActiveByNameCacheParams {
  name: string;
}

export const invalidateActiveByNameCache = async ({
  name,
}: InvalidateActiveByNameCacheParams): Promise<void> => {
  await getSystemAgentCache().delete({
    key: buildActiveByNameCacheKey({ name }),
  });
};

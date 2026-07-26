import mcpDomain from '@vassembly/domain-mcp';
import { userMcpConfigDomain, mcpRequiresConfiguration } from '@vassembly/domain-user-mcp-config';
import { UnauthorizedError } from '@vassembly/errors';

import type { EnrichedMcpListItem } from '../enrichMcpListWithUserStatus/types';

import type {
  ListUserMcpConfigurationsInput,
  ListUserMcpConfigurationsResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { ListUserMcpConfigurationsInput, ListUserMcpConfigurationsResult };

export const listUserMcpConfigurations = async (
  input: ListUserMcpConfigurationsInput,
  context: ServiceContext,
): Promise<ListUserMcpConfigurationsResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const configsResult = await userMcpConfigDomain.queries.getUserMcpConfigs({
    userId: context.userId,
    page: input.page,
    size: input.size,
  });

  if (configsResult.items.length === 0) {
    return {
      items: [],
      total: configsResult.total,
      page: configsResult.page,
      size: configsResult.size,
    };
  }

  const mcpIds = configsResult.items.map((config) => config.mcpId);
  const mcpsResult = await mcpDomain.queries.getByIds({ ids: mcpIds });
  const mcpLookup = new Map(mcpsResult.items.map((mcp) => [mcp.id, mcp]));

  const items = configsResult.items.reduce<EnrichedMcpListItem[]>((accumulator, config) => {
    const mcp = mcpLookup.get(config.mcpId);

    if (mcp === undefined) {
      return accumulator;
    }

    accumulator.push({
      ...mcp,
      configurationStatus: 'configured',
      enabled: config.enabled,
      requiresConfiguration: mcpRequiresConfiguration({ schema: mcp.configSchema }),
      updatedAt: config.updatedAt,
    });

    return accumulator;
  }, []);

  return {
    items,
    total: configsResult.total,
    page: configsResult.page,
    size: configsResult.size,
  };
};

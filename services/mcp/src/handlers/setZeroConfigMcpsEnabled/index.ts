import mcpDomain, { MAX_PAGE_SIZE } from '@vassembly/domain-mcp';
import { userMcpConfigDomain, mcpRequiresConfiguration } from '@vassembly/domain-user-mcp-config';
import { UnauthorizedError } from '@vassembly/errors';

import type { SetZeroConfigMcpsEnabledInput, SetZeroConfigMcpsEnabledResult } from './types';
import type { ServiceContext } from '../../types';

export type { SetZeroConfigMcpsEnabledInput, SetZeroConfigMcpsEnabledResult };

export const setZeroConfigMcpsEnabled = async (
  input: SetZeroConfigMcpsEnabledInput,
  context: ServiceContext,
): Promise<SetZeroConfigMcpsEnabledResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const catalogItems = [];
  let page = 0;
  let total = 0;

  do {
    const catalogPage = await mcpDomain.queries.getList({ page, size: MAX_PAGE_SIZE });
    catalogItems.push(...catalogPage.items);
    total = catalogPage.total;
    page += 1;
  } while (catalogItems.length < total);

  const zeroConfigMcps = catalogItems.filter(
    (mcp) => !mcpRequiresConfiguration({ schema: mcp.configSchema }),
  );

  const mcpIds = zeroConfigMcps.map((mcp) => mcp.id);

  let mcpsToUpdate = zeroConfigMcps;

  if (!input.enabled && mcpIds.length > 0) {
    const statuses = await userMcpConfigDomain.queries.getMcpUserStatuses({
      userId: context.userId,
      mcpIds,
    });

    mcpsToUpdate = zeroConfigMcps.filter((mcp) => statuses[mcp.id]?.enabled === true);
  }

  await Promise.all(
    mcpsToUpdate.map((mcp) =>
      userMcpConfigDomain.commands.setUserMcpEnabled({
        userId: context.userId,
        mcpId: mcp.id,
        enabled: input.enabled,
        schema: mcp.configSchema ?? { fields: [] },
      }),
    ),
  );

  return {
    enabled: input.enabled,
    mcpIds,
    updatedCount: mcpsToUpdate.length,
  };
};

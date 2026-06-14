import { userMcpConfigDao } from '../clients/mongodb';
import { USER_MCP_CONFIG_STATUS } from '../constants';

export type ConfigurationStatusValue = typeof USER_MCP_CONFIG_STATUS.Configured | 'pending';

export interface GetConfigurationStatusesInput {
  userId: string;
  mcpIds: string[];
}

export const getConfigurationStatuses = async (
  input: GetConfigurationStatusesInput,
): Promise<Record<string, ConfigurationStatusValue>> => {
  const { userId, mcpIds } = input;

  const configs = await userMcpConfigDao.getListByUserId({ userId });
  const configuredMcpIds = new Set(configs.map((config) => config.mcpId));

  return mcpIds.reduce<Record<string, ConfigurationStatusValue>>((statuses, mcpId) => {
    statuses[mcpId] = configuredMcpIds.has(mcpId)
      ? USER_MCP_CONFIG_STATUS.Configured
      : 'pending';
    return statuses;
  }, {});
};

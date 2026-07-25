import { userMcpConfigDao } from '../clients/mongodb';
import { USER_MCP_CONFIG_STATUS } from '../constants';

export type ConfigurationStatusValue = typeof USER_MCP_CONFIG_STATUS.Configured | 'pending';

export interface McpUserStatus {
  configurationStatus: ConfigurationStatusValue;
  enabled: boolean;
}

export interface GetConfigurationStatusesInput {
  userId: string;
  mcpIds: string[];
}

export const getMcpUserStatuses = async (
  input: GetConfigurationStatusesInput,
): Promise<Record<string, McpUserStatus>> => {
  const { userId, mcpIds } = input;

  const configs = await userMcpConfigDao.getListByUserId({ userId });
  const configByMcpId = new Map(configs.map((config) => [config.mcpId, config]));

  return mcpIds.reduce<Record<string, McpUserStatus>>((statuses, mcpId) => {
    const config = configByMcpId.get(mcpId);

    if (!config) {
      statuses[mcpId] = {
        configurationStatus: 'pending',
        enabled: false,
      };
      return statuses;
    }

    statuses[mcpId] = {
      configurationStatus: USER_MCP_CONFIG_STATUS.Configured,
      enabled: config.enabled ?? true,
    };

    return statuses;
  }, {});
};

export const getConfigurationStatuses = async (
  input: GetConfigurationStatusesInput,
): Promise<Record<string, ConfigurationStatusValue>> => {
  const statuses = await getMcpUserStatuses(input);

  return Object.fromEntries(
    Object.entries(statuses).map(([mcpId, status]) => [mcpId, status.configurationStatus]),
  );
};

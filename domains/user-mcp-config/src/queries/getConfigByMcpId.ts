import { userMcpConfigDao } from '../clients/mongodb';

export interface GetConfigByMcpIdInput {
  mcpId: string;
}

export interface ConfigOwnerRecord {
  userId: string;
  mcpId: string;
}

export const getConfigByMcpId = async (
  input: GetConfigByMcpIdInput,
): Promise<ConfigOwnerRecord | null> => {
  const { mcpId } = input;

  const record = await userMcpConfigDao.getByMcpId({ mcpId });

  if (!record) {
    return null;
  }

  return {
    userId: record.userId,
    mcpId: record.mcpId,
  };
};

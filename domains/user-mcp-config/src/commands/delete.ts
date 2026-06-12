import { userMcpConfigDao } from '../clients/mongodb';

export interface DeleteCommandInput {
  userId: string;
  mcpId: string;
}

export interface DeleteCommandResult {
  success: boolean;
}

export const deleteUserMcpConfig = async (input: DeleteCommandInput): Promise<DeleteCommandResult> => {
  const { userId, mcpId } = input;

  const config = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (!config) {
    return { success: true };
  }

  await userMcpConfigDao.remove({ userId, mcpId });

  return { success: true };
};

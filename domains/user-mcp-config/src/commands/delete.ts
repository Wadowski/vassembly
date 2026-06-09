import { UnauthorizedError } from '@vassembly/errors';

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

  const config = await userMcpConfigDao.getByMcpId({ mcpId });

  if (!config) {
    return { success: true };
  }

  if (config.userId !== userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  await userMcpConfigDao.remove({ userId, mcpId });

  return { success: true };
};

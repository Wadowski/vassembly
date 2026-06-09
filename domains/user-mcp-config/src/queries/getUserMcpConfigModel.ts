import { userMcpConfigDao } from '../clients/mongodb';
import { toModel } from '../commands/shared/toModel';
import type { UserMcpConfigModel } from '../model/model';

export interface GetUserMcpConfigModelInput {
  userId: string;
  mcpId: string;
}

export const getUserMcpConfigModel = async (
  input: GetUserMcpConfigModelInput,
): Promise<UserMcpConfigModel | null> => {
  const { userId, mcpId } = input;

  const record = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (!record) {
    return null;
  }

  return toModel({ record });
};

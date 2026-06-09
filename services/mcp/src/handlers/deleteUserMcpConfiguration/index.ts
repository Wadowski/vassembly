import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import { UnauthorizedError } from '@vassembly/errors';

import type {
  DeleteUserMcpConfigurationInput,
  DeleteUserMcpConfigurationResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { DeleteUserMcpConfigurationInput, DeleteUserMcpConfigurationResult };

export const deleteUserMcpConfiguration = async (
  input: DeleteUserMcpConfigurationInput,
  context: ServiceContext,
): Promise<DeleteUserMcpConfigurationResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  await userMcpConfigDomain.commands.deleteUserMcpConfig({
    userId: context.userId,
    mcpId: input.mcpId,
  });

  return { success: true };
};

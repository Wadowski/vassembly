import mcpDomain from '@vassembly/domain-mcp';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { WrongParamError } from '@vassembly/errors';

export interface ValidateAssignedMcpIdsParams {
  userId: string;
  assignedMcpIds: string[];
}

export const validateAssignedMcpIds = async ({
  userId,
  assignedMcpIds,
}: ValidateAssignedMcpIdsParams): Promise<void> => {
  await Promise.all(
    assignedMcpIds.map(async (mcpId) => {
      await mcpDomain.queries.getById({ id: mcpId });

      const config = await userMcpConfigDomain.queries.getUserMcpConfigModel({
        userId,
        mcpId,
      });

      if (config === null) {
        throw new WrongParamError(`MCP ${mcpId} is not configured`);
      }
    }),
  );
};

import mcpDomain from '@vassembly/domain-mcp';

const MCP_LIST_PAGE_SIZE = 500;

export interface ResolveSpecializationMcpIdsParams {
  specializationId: string;
}

export const resolveSpecializationMcpIds = async ({
  specializationId,
}: ResolveSpecializationMcpIdsParams): Promise<string[]> => {
  const mcpListResult = await mcpDomain.queries.getList({
    specializationId,
    page: 0,
    size: MCP_LIST_PAGE_SIZE,
  });

  return mcpListResult.items.map((item) => item.id);
};

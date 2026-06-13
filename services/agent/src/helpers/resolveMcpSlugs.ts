import mcpDomain from '@vassembly/domain-mcp';

export interface ResolveMcpSlugsParams {
  mcpIds: string[];
}

export const resolveMcpSlugs = async ({
  mcpIds,
}: ResolveMcpSlugsParams): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    mcpIds.map(async (mcpId) => {
      const result = await mcpDomain.queries.getById({ id: mcpId });
      return [mcpId, result.data.slug] as const;
    }),
  );

  return Object.fromEntries(entries);
};

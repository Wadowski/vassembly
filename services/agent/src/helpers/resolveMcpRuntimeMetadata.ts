import { config } from '@vassembly/config';
import mcpDomain from '@vassembly/domain-mcp';

export interface McpRuntimeMetadata {
  slug: string;
  serverUrl: string | null;
}

export interface ResolveMcpRuntimeMetadataParams {
  mcpIds: string[];
}

export const resolveMcpRuntimeMetadata = async ({
  mcpIds,
}: ResolveMcpRuntimeMetadataParams): Promise<Record<string, McpRuntimeMetadata>> => {
  const entries = await Promise.all(
    mcpIds.map(async (mcpId) => {
      const result = await mcpDomain.queries.getModelById({ id: mcpId });
      const slug = result.data.slug;
      const serverUrl =
        result.data.serverUrl ?? config.mcpServers.serverUrls[slug] ?? null;

      return [
        mcpId,
        {
          slug,
          serverUrl,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
};

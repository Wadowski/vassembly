export interface McpCatalogEntry {
  name: string;
  slug: string;
  description: string;
  tags?: string[];
}

export interface FormatMcpCatalogSectionParams {
  mcps: McpCatalogEntry[];
}

export const formatMcpCatalogSection = ({
  mcps,
}: FormatMcpCatalogSectionParams): string => {
  if (mcps.length === 0) {
    return '';
  }

  return mcps
    .map((mcp) => {
      const tagsSuffix =
        mcp.tags && mcp.tags.length > 0 ? ` [tags: ${mcp.tags.join(', ')}]` : '';

      return `- ${mcp.name} (${mcp.slug}): ${mcp.description}${tagsSuffix}`;
    })
    .join('\n');
};

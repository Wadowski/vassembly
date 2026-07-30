import mcpDomain from '@vassembly/domain-mcp';

import { formatMcpCatalogSection } from '../shared/formatMcpCatalogSection';

import type { McpCatalogHintEntry } from './detectMentionedPlatformsInDescription';

const MCP_CATALOG_PAGE_SIZE = 200;

export const buildMcpCatalogHintsSectionFromItems = ({
  mcpItems,
}: {
  mcpItems: McpCatalogHintEntry[];
}): string => {
  if (mcpItems.length === 0) {
    return 'No cataloged MCPs.';
  }

  const formattedCatalog = formatMcpCatalogSection({
    mcps: mcpItems.map((mcp) => ({
      name: mcp.name,
      slug: mcp.slug,
      description: mcp.description,
      tags: mcp.tags,
    })),
  });

  return ['Available tools/platforms:', formattedCatalog].join('\n');
};

export const buildMcpCatalogHintsSection = async (): Promise<string> => {
  const catalogResult = await mcpDomain.queries.getList({
    page: 0,
    size: MCP_CATALOG_PAGE_SIZE,
  });

  return buildMcpCatalogHintsSectionFromItems({
    mcpItems: catalogResult.items.map((mcp) => ({
      name: mcp.name,
      slug: mcp.slug,
      description: mcp.description,
      tags: mcp.tags ?? [],
    })),
  });
};

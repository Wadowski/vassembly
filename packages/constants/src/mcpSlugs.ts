export enum MCP_SLUG {
  BraveSearchMcp = 'brave-search-mcp',
  WikipediaMcp = 'wikipedia-mcp',
}

export const getMcpSlugs = (): MCP_SLUG[] => Object.values(MCP_SLUG);

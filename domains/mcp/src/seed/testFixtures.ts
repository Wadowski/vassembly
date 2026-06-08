import type { McpSeedEntry } from './types';

export const VALID_SEED_ENTRIES: McpSeedEntry[] = [
  {
    slug: 'google-workspace-mcp',
    name: 'Gmail MCP',
    description:
      'Complete email management, calendar, documents, sheets, slides, forms, and chat integration',
    tags: ['productivity', 'email', 'google-workspace', 'calendar', 'documents'],
    iconPath: '/mcps/gmail.svg',
    documentationUrl: 'https://glama.ai/mcp/servers/taylorwilsdon/google_workspace_mcp',
    repositoryUrl: 'https://github.com/taylorwilsdon/google_workspace_mcp',
  },
  {
    slug: 'brave-search-mcp',
    name: 'Brave Search MCP',
    description:
      'Comprehensive search capabilities including web search, local business search, image search, video search, news search, and AI-powered summarization',
    tags: ['search', 'web', 'ai-summary', 'news', 'images'],
    iconPath: '/mcps/brave-search.svg',
    documentationUrl: 'https://glama.ai/mcp/servers/brave/brave-search-mcp-server',
    repositoryUrl: 'https://github.com/brave/brave-search-mcp-server',
  },
];

export const VALID_SEED_JSON = JSON.stringify(VALID_SEED_ENTRIES);

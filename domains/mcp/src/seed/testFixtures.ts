import type { McpSeedEntry } from './types';

export const VALID_SEED_ENTRIES: McpSeedEntry[] = [
  {
    slug: 'brave-search-mcp',
    name: 'Brave Search MCP',
    description:
      'Web search, news, images, and AI-powered summarization via Brave Search',
    tags: ['search', 'web', 'ai-summary', 'news', 'images'],
    iconPath: '/mcps/brave-search.svg',
    documentationUrl: 'https://github.com/brave/brave-search-mcp-server',
    repositoryUrl: 'https://github.com/brave/brave-search-mcp-server',
    category: 'search',
    transport: 'stdio-wrapped',
    dockerImage: 'ghcr.io/onprem-ai/mcp-key-proxy:latest',
    configSchema: {
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          description: 'Your Brave Search API key',
          required: true,
          placeholder: 'Enter your Brave Search API key',
        },
      ],
    },
  },
  {
    slug: 'wikipedia-mcp',
    name: 'Wikipedia MCP',
    description: 'Search and retrieve articles from Wikipedia',
    tags: ['search', 'knowledge', 'wikipedia'],
    iconPath: '/mcps/brave-search.svg',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/wikipedia',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    category: 'search',
    transport: 'stdio-wrapped',
    dockerImage: 'vassembly/mcp-wikipedia-mcp:local',
    configSchema: {
      fields: [],
    },
  },
];

export const VALID_SEED_JSON = JSON.stringify(VALID_SEED_ENTRIES);

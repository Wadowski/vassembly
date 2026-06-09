import type { McpWithConfigurationStatus, UserConfiguredMcpItem } from '@vassembly/ui-api-hooks';

export const MOCK_USER_CONFIGURED_MCPS: UserConfiguredMcpItem[] = [
  {
    id: 'config-gmail-1',
    mcpId: 'mcp-gmail',
    status: 'configured',
    lastTestedAt: '2026-06-08T12:00:00.000Z',
    updatedAt: '2026-06-08T14:00:00.000Z',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
  {
    id: 'config-brave-1',
    mcpId: 'mcp-brave',
    status: 'configured',
    lastTestedAt: '2026-06-07T10:00:00.000Z',
    updatedAt: '2026-06-07T12:00:00.000Z',
    createdAt: '2026-06-07T08:00:00.000Z',
  },
];

export const MOCK_DISCOVER_MCPS: McpWithConfigurationStatus[] = [
  {
    id: 'mcp-gmail',
    name: 'Gmail MCP',
    description: 'Send and read Gmail messages',
    tags: ['email', 'google'],
    iconPath: '/icons/gmail.svg',
    slug: 'gmail-mcp',
    documentationUrl: 'https://docs.example.com/gmail-mcp',
    repositoryUrl: 'https://github.com/example/gmail-mcp',
    configurationStatus: 'configured',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-08T12:00:00.000Z',
  },
  {
    id: 'mcp-brave',
    name: 'Brave Search MCP',
    description: 'Search the web with Brave',
    tags: ['search'],
    iconPath: '/icons/brave.svg',
    slug: 'brave-search-mcp',
    documentationUrl: 'https://docs.example.com/brave-mcp',
    repositoryUrl: 'https://github.com/example/brave-mcp',
    configurationStatus: 'pending',
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-07T12:00:00.000Z',
  },
  {
    id: 'mcp-slack',
    name: 'Slack MCP',
    description: 'Integrate with Slack workspaces',
    tags: ['communication'],
    iconPath: '/icons/slack.svg',
    slug: 'slack-mcp',
    configurationStatus: 'pending',
    createdAt: '2026-06-03T10:00:00.000Z',
    updatedAt: '2026-06-06T12:00:00.000Z',
  },
];

export const MOCK_CONFIGURED_MCP_LOOKUP: Record<string, McpWithConfigurationStatus> = {
  'mcp-gmail': MOCK_DISCOVER_MCPS[0],
  'mcp-brave': MOCK_DISCOVER_MCPS[1],
};

export const YOUR_MCPS_EMPTY_MESSAGE =
  'No MCPs configured yet. Browse below to get started.';

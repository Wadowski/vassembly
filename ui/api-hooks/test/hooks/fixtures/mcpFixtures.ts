export const MOCK_MCP_GMAIL = {
  id: 'mcp-gmail',
  name: 'Gmail MCP',
  description: 'Gmail integration',
  tags: ['email'],
  iconPath: '/icons/gmail.svg',
  slug: 'gmail-mcp',
  configurationStatus: 'configured' as const,
  configSchema: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

export const MOCK_MCP_BRAVE = {
  id: 'mcp-brave',
  name: 'Brave Search MCP',
  description: 'Brave search integration',
  tags: ['search'],
  iconPath: '/icons/brave.svg',
  slug: 'brave-search-mcp',
  configurationStatus: 'pending' as const,
  configSchema: {
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
  },
  createdAt: '2026-06-02T10:00:00.000Z',
  updatedAt: '2026-06-07T12:00:00.000Z',
};

export const MOCK_MASKED_CONFIGURATION = {
  id: 'config-gmail-1',
  userId: 'user-123',
  mcpId: 'mcp-gmail',
  status: 'configured',
  fieldValues: [
    { key: 'apiKey', hasSecret: true },
    { key: 'refreshToken', hasSecret: true },
    { key: 'scopes', value: 'gmail.readonly' },
  ],
  createdAt: '2026-06-08T10:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

export const MOCK_CONFIGURED_MCPS = [
  {
    ...MOCK_MASKED_CONFIGURATION,
    mcpId: 'mcp-gmail',
    updatedAt: '2026-06-08T14:00:00.000Z',
  },
  {
    ...MOCK_MASKED_CONFIGURATION,
    id: 'config-brave-1',
    mcpId: 'mcp-brave',
    updatedAt: '2026-06-08T10:00:00.000Z',
  },
  {
    ...MOCK_MASKED_CONFIGURATION,
    id: 'config-slack-1',
    mcpId: 'mcp-slack',
    updatedAt: '2026-06-08T08:00:00.000Z',
  },
];

export const MOCK_SAVE_CONFIGURATION_RESPONSE = {
  id: 'config-gmail-1',
  userId: 'user-123',
  mcpId: 'mcp-gmail',
  status: 'configured',
  fieldValues: [
    { key: 'apiKey', hasSecret: true },
    { key: 'refreshToken', hasSecret: true },
  ],
  createdAt: '2026-06-08T12:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

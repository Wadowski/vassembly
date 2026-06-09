import type { McpConfiguration, McpDetail } from '@vassembly/ui-api-hooks';

export const MOCK_MCP_ID = 'mcp-gmail';

export const MOCK_MCP_WITH_FULL_SCHEMA: McpDetail = {
  id: MOCK_MCP_ID,
  name: 'Gmail MCP',
  description: 'Connect Gmail to your workspace',
  tags: ['email', 'google'],
  iconPath: '/icons/gmail.svg',
  slug: 'gmail-mcp',
  documentationUrl: 'https://docs.example.com/gmail-mcp',
  repositoryUrl: 'https://github.com/example/gmail-mcp',
  configurationStatus: 'pending',
  configSchema: {
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Enter client ID',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'us-east-1', label: 'US East (N. Virginia)' },
          { value: 'eu-west-1', label: 'EU West (Ireland)' },
        ],
      },
      {
        key: 'readOnly',
        label: 'Enable read-only mode',
        type: 'checkbox',
        description: 'Restrict actions to read-only operations',
      },
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        format: 'url',
        required: true,
      },
      {
        key: 'contactEmail',
        label: 'Contact Email',
        type: 'text',
        format: 'email',
        required: false,
      },
    ],
  },
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

export const MOCK_MCP_WITHOUT_SCHEMA: McpDetail = {
  ...MOCK_MCP_WITH_FULL_SCHEMA,
  configSchema: { fields: [] },
};

export const MOCK_MCP_CONFIGURED: McpDetail = {
  ...MOCK_MCP_WITH_FULL_SCHEMA,
  configurationStatus: 'configured',
};

export const MOCK_SAVED_CONFIGURATION: McpConfiguration = {
  id: 'config-gmail-1',
  mcpId: MOCK_MCP_ID,
  status: 'configured',
  lastTestedAt: '2026-06-08T12:00:00.000Z',
  fieldValues: [
    { key: 'clientId', value: 'saved-client-id' },
    { key: 'clientSecret', hasSecret: true },
    { key: 'region', value: 'us-east-1' },
    { key: 'readOnly', value: true },
    { key: 'webhookUrl', value: 'https://hooks.example.com/gmail' },
    { key: 'contactEmail', value: 'admin@example.com' },
  ],
  createdAt: '2026-06-08T10:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

export const MOCK_TEST_CONNECTION_SUCCESS = {
  success: true,
};

export const MOCK_TEST_CONNECTION_FAILURE = {
  success: false,
  error: 'Invalid API key',
};

export const MOCK_SAVE_CONFIGURATION_RESPONSE = {
  id: 'config-gmail-1',
  userId: 'user-123',
  mcpId: MOCK_MCP_ID,
  status: 'configured',
  fieldValues: MOCK_SAVED_CONFIGURATION.fieldValues,
  createdAt: '2026-06-08T12:00:00.000Z',
  updatedAt: '2026-06-08T12:30:00.000Z',
};

export const NO_CONFIGURATION_MESSAGE = 'This MCP does not require configuration';
export const NOT_FOUND_MESSAGE = 'MCP not found';
export const PASSWORD_KEEP_HINT = 'Leave blank to keep existing key';
export const CONNECTION_VERIFIED_MESSAGE = 'Connection verified';
export const CONFIGURATION_SAVED_MESSAGE = 'Configuration saved';
export const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Please try again.';

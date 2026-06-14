import type { McpConfigSchema } from '../../src/model/configSchema';

export const mockGmailSchema: McpConfigSchema = {
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    {
      key: 'scopes',
      label: 'Scopes',
      type: 'select',
      required: true,
      options: [{ value: 'readonly', label: 'Read Only' }],
    },
  ],
};

export const mockBraveSchema: McpConfigSchema = {
  fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
};

export const mockSimpleTextSchema: McpConfigSchema = {
  fields: [{ key: 'someField', label: 'Field', type: 'text', required: false }],
};

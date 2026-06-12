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
    configSchema: {
      fields: [
        {
          key: 'clientId',
          label: 'Client ID',
          type: 'text',
          required: true,
        },
        {
          key: 'clientSecret',
          label: 'Client Secret',
          type: 'password',
          required: true,
        },
        {
          key: 'scopes',
          label: 'Access Level',
          type: 'select',
          required: true,
          options: [
            { value: 'readonly', label: 'Read only' },
            { value: 'full', label: 'Full access' },
          ],
        },
        {
          key: 'acceptTerms',
          label: 'I accept the provider terms',
          type: 'checkbox',
          required: true,
        },
      ],
    },
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
        {
          key: 'transport',
          label: 'Transport Mode',
          type: 'select',
          description: 'Transport mode for MCP server',
          required: false,
          defaultValue: 'stdio',
          options: [
            { value: 'stdio', label: 'STDIO (Default)' },
            { value: 'http', label: 'HTTP' },
          ],
        },
        {
          key: 'port',
          label: 'Port',
          type: 'text',
          description: 'HTTP server port (default: 8000)',
          required: false,
          placeholder: '8000',
          pattern: '^[0-9]{1,5}$',
        },
        {
          key: 'host',
          label: 'Host',
          type: 'text',
          description: 'HTTP server host (default: 0.0.0.0)',
          required: false,
          placeholder: '0.0.0.0',
        },
        {
          key: 'logLevel',
          label: 'Log Level',
          type: 'select',
          description: 'Desired logging level',
          required: false,
          defaultValue: 'info',
          options: [
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'notice', label: 'Notice' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
            { value: 'critical', label: 'Critical' },
            { value: 'alert', label: 'Alert' },
            { value: 'emergency', label: 'Emergency' },
          ],
        },
        {
          key: 'enabledTools',
          label: 'Enabled Tools',
          type: 'text',
          description:
            'Space-separated whitelist of tools to enable (e.g., "brave_web_search brave_news_search")',
          required: false,
          placeholder: 'Leave empty to enable all tools',
        },
        {
          key: 'disabledTools',
          label: 'Disabled Tools',
          type: 'text',
          description:
            'Space-separated blacklist of tools to disable (e.g., "brave_image_search")',
          required: false,
          placeholder: 'Leave empty to disable no tools',
        },
        {
          key: 'stateless',
          label: 'Stateless Mode',
          type: 'checkbox',
          description: 'HTTP stateless mode (recommended for Amazon Bedrock)',
          required: false,
          defaultValue: true,
        },
      ],
    },
  },
];

export const VALID_SEED_JSON = JSON.stringify(VALID_SEED_ENTRIES);

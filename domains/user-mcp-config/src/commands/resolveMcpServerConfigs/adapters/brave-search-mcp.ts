import type { McpRuntimeAdapter } from './types';

const BRAVE_SEARCH_PACKAGE = '@brave/brave-search-mcp-server';

const readOptionalString = (value: string | boolean | undefined): string | undefined => {
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }

  return value;
};

export const braveSearchMcpRuntimeAdapter: McpRuntimeAdapter = {
  toServerConfig: ({ mcpId, fieldValues }) => {
    const apiKey = readOptionalString(fieldValues.apiKey);

    if (!apiKey) {
      return null;
    }

    const transport = fieldValues.transport === 'http' ? 'http' : 'stdio';

    if (transport === 'http') {
      const port = readOptionalString(fieldValues.port) ?? '8000';
      const host = readOptionalString(fieldValues.host) ?? '0.0.0.0';
      const resolvedHost = host === '0.0.0.0' ? '127.0.0.1' : host;

      return {
        serverName: mcpId,
        transport: 'http',
        url: `http://${resolvedHost}:${port}/mcp`,
      };
    }

    const env: Record<string, string> = {
      BRAVE_API_KEY: apiKey,
    };

    const logLevel = readOptionalString(fieldValues.logLevel);
    if (logLevel) {
      env.BRAVE_MCP_LOG_LEVEL = logLevel;
    }

    const enabledTools = readOptionalString(fieldValues.enabledTools);
    if (enabledTools) {
      env.BRAVE_MCP_ENABLED_TOOLS = enabledTools;
    }

    const disabledTools = readOptionalString(fieldValues.disabledTools);
    if (disabledTools) {
      env.BRAVE_MCP_DISABLED_TOOLS = disabledTools;
    }

    if (fieldValues.stateless === true) {
      env.BRAVE_MCP_STATELESS = 'true';
    }

    return {
      serverName: mcpId,
      transport: 'stdio',
      command: 'npx',
      args: ['-y', BRAVE_SEARCH_PACKAGE, '--transport', 'stdio'],
      env,
    };
  },
};

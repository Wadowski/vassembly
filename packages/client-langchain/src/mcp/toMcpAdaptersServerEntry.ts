import { WrongParamError } from '@vassembly/errors';
import type { Connection } from '@langchain/mcp-adapters';

import type { McpServerConfig } from './types';

export const toMcpAdaptersServerEntry = (config: McpServerConfig): Connection => {
  if (config.transport === 'stdio') {
    if (!config.command) {
      throw new WrongParamError(`MCP server ${config.serverName} is missing stdio command`);
    }

    return {
      transport: 'stdio',
      command: config.command,
      args: config.args ?? [],
      env: config.env,
    };
  }

  if (config.transport === 'http' || config.transport === 'sse') {
    if (!config.url) {
      throw new WrongParamError(`MCP server ${config.serverName} is missing URL`);
    }

    return {
      transport: config.transport,
      url: config.url,
      headers: config.headers,
    };
  }

  throw new WrongParamError(`Unsupported MCP transport for ${config.serverName}`);
};

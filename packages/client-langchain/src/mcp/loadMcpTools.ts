import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { Connection } from '@langchain/mcp-adapters';
import type { DynamicStructuredTool } from '@langchain/core/tools';

import { toMcpAdaptersServerEntry } from './toMcpAdaptersServerEntry';

import type { McpServerConfig } from './types';

export interface LoadMcpToolsParams {
  serverConfigs: McpServerConfig[];
}

export interface LoadMcpToolsResult {
  tools: DynamicStructuredTool[];
  close: () => Promise<void>;
}

export const loadMcpTools = async ({
  serverConfigs,
}: LoadMcpToolsParams): Promise<LoadMcpToolsResult> => {
  const mcpServers = Object.fromEntries(
    serverConfigs.map((config) => [config.serverName, toMcpAdaptersServerEntry(config)]),
  ) as Record<string, Connection>;

  const client = new MultiServerMCPClient({
    mcpServers,
    throwOnLoadError: false,
  });

  const tools = await client.getTools();

  return {
    tools,
    close: () => client.close(),
  };
};

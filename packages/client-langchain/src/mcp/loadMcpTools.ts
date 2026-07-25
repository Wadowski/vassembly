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
  toolNameToServerName: Map<string, string>;
  close: () => Promise<void>;
}

const loadToolsForServer = async ({
  client,
  serverName,
}: {
  client: MultiServerMCPClient;
  serverName: string;
}): Promise<DynamicStructuredTool[]> => {
  const getTools = client.getTools.bind(client) as (
    serverName?: string,
  ) => Promise<DynamicStructuredTool[]>;

  if (serverName.length > 0) {
    return getTools(serverName);
  }

  return getTools();
};

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

  const toolNameToServerName = new Map<string, string>();
  const tools: DynamicStructuredTool[] = [];

  if (serverConfigs.length === 1) {
    const onlyServer = serverConfigs[0]!;
    const serverTools = await loadToolsForServer({ client, serverName: onlyServer.serverName });

    for (const tool of serverTools) {
      toolNameToServerName.set(tool.name, onlyServer.serverName);
      tools.push(tool);
    }
  } else {
    for (const config of serverConfigs) {
      const serverTools = await loadToolsForServer({ client, serverName: config.serverName });

      for (const tool of serverTools) {
        toolNameToServerName.set(tool.name, config.serverName);
        tools.push(tool);
      }
    }

    if (tools.length === 0) {
      const flatTools = await client.getTools();

      for (const tool of flatTools) {
        tools.push(tool);
      }
    }
  }

  return {
    tools,
    toolNameToServerName,
    close: () => client.close(),
  };
};

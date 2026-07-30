import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { Connection } from '@langchain/mcp-adapters';
import type { DynamicStructuredTool } from '@langchain/core/tools';

import { decorateMcpToolDescription, parseOriginalMcpToolName } from './mcpToolNameUtils';
import { toMcpAdaptersServerEntry } from './toMcpAdaptersServerEntry';

import type { McpServerConfig } from './types';

export interface LoadMcpToolsParams {
  serverConfigs: McpServerConfig[];
}

export interface LoadMcpToolsResult {
  tools: DynamicStructuredTool[];
  toolNameToServerName: Map<string, string>;
  toolNameToOriginalName: Map<string, string>;
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

const registerServerTools = ({
  serverTools,
  serverName,
  label,
  toolNameToServerName,
  toolNameToOriginalName,
  tools,
}: {
  serverTools: DynamicStructuredTool[];
  serverName: string;
  label?: string;
  toolNameToServerName: Map<string, string>;
  toolNameToOriginalName: Map<string, string>;
  tools: DynamicStructuredTool[];
}): void => {
  for (const tool of serverTools) {
    const decoratedTool =
      label !== undefined && label.length > 0
        ? decorateMcpToolDescription({ tool, label })
        : tool;

    toolNameToServerName.set(decoratedTool.name, serverName);
    toolNameToOriginalName.set(
      decoratedTool.name,
      parseOriginalMcpToolName({ toolName: decoratedTool.name, serverName }),
    );
    tools.push(decoratedTool);
  }
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
    prefixToolNameWithServerName: true,
    additionalToolNamePrefix: 'mcp',
  });

  const toolNameToServerName = new Map<string, string>();
  const toolNameToOriginalName = new Map<string, string>();
  const tools: DynamicStructuredTool[] = [];

  if (serverConfigs.length === 1) {
    const onlyServer = serverConfigs[0]!;
    const serverTools = await loadToolsForServer({ client, serverName: onlyServer.serverName });

    registerServerTools({
      serverTools,
      serverName: onlyServer.serverName,
      label: onlyServer.label,
      toolNameToServerName,
      toolNameToOriginalName,
      tools,
    });
  } else {
    for (const config of serverConfigs) {
      const serverTools = await loadToolsForServer({ client, serverName: config.serverName });

      registerServerTools({
        serverTools,
        serverName: config.serverName,
        label: config.label,
        toolNameToServerName,
        toolNameToOriginalName,
        tools,
      });
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
    toolNameToOriginalName,
    close: () => client.close(),
  };
};

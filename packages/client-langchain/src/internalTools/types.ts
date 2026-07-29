import type { DynamicStructuredTool } from '@langchain/core/tools';

export type InternalToolHandler = (args: Record<string, unknown>) => Promise<string>;

export interface BuildInternalToolsParams {
  toolIds: string[];
  handlers: Record<string, InternalToolHandler>;
}

export interface BuildInternalToolsResult {
  tools: DynamicStructuredTool[];
  boundToolIds: string[];
  skippedToolIds: string[];
  toolNameToInternalToolId: Map<string, string>;
}

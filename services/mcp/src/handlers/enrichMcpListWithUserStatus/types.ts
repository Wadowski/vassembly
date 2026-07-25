import type { McpListItemResponse } from '@vassembly/domain-mcp';
import type { ServiceContext } from '../../types';

export interface EnrichMcpListInput {
  mcps: McpListItemResponse[];
}

export type EnrichedMcpListItem = McpListItemResponse & {
  configurationStatus: 'configured' | 'pending';
  enabled: boolean;
  requiresConfiguration: boolean;
};

export interface EnrichMcpListWithUserStatusParams {
  input: EnrichMcpListInput;
  context: ServiceContext;
}

export type EnrichMcpListWithUserStatusResult = EnrichedMcpListItem[];

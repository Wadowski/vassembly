import type { McpConfigSchema } from '../../model/configSchema';

export interface SetUserMcpEnabledInput {
  userId: string;
  mcpId: string;
  enabled: boolean;
  schema: McpConfigSchema;
}

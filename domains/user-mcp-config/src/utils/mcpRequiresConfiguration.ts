import type { McpConfigSchema } from '../model/configSchema';

export interface McpRequiresConfigurationParams {
  schema?: McpConfigSchema | null;
}

export const mcpRequiresConfiguration = ({ schema }: McpRequiresConfigurationParams): boolean =>
  (schema?.fields?.length ?? 0) > 0;

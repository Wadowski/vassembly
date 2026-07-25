import type { McpConfigSchema } from '../../model/configSchema';
import type { TestConnectionResult } from '../../types';
import { testMcpServerConnection } from '../../clients/langchain';
import { getMcpRuntimeAdapter } from '../resolveMcpServerConfigs/adapters';
import { decodePasswordFields } from '../shared/decodePasswordFields';
import { validateFieldValues } from '../shared/validateFieldValues';

export interface TestMcpConnectionCommandInput {
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
  mcpSlug: string;
  serverUrl: string | null;
}

const buildConnectionError = ({ serverUrl }: { serverUrl: string | null }): string => {
  if (!serverUrl) {
    return 'MCP server URL is not configured';
  }

  return 'Missing required configuration values';
};

export const testMcpConnection = async (
  input: TestMcpConnectionCommandInput,
): Promise<TestConnectionResult> => {
  const { fieldValues, schema, mcpSlug, mcpId, serverUrl } = input;

  validateFieldValues({ schema, values: fieldValues });

  const decodedFieldValues = decodePasswordFields({ fieldValues, schema });
  const adapter = getMcpRuntimeAdapter({ slug: mcpSlug });
  const serverConfig = adapter.toServerConfig({
    mcpId,
    fieldValues: decodedFieldValues,
    serverUrl,
  });

  if (!serverConfig) {
    return {
      success: false,
      error: buildConnectionError({ serverUrl }),
    };
  }

  return testMcpServerConnection({ serverConfig });
};

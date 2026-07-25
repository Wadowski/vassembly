import { testMcpConnection } from '@vassembly/client-langchain';

import type { McpServerConfig } from '@vassembly/client-langchain';
import type { TestConnectionResult } from '../types';

export interface TestMcpServerConnectionParams {
  serverConfig: McpServerConfig;
}

export const testMcpServerConnection = async ({
  serverConfig,
}: TestMcpServerConnectionParams): Promise<TestConnectionResult> => {
  const result = await testMcpConnection({ serverConfig });

  return {
    success: result.success,
    error: result.error,
  };
};

export type { McpServerConfig };

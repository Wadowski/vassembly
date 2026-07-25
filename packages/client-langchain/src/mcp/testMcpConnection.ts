import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { Connection } from '@langchain/mcp-adapters';

import { toMcpAdaptersServerEntry } from './toMcpAdaptersServerEntry';

import type { McpServerConfig } from './types';

export const MCP_TEST_CONNECTION_TIMEOUT_MS = 15_000;

export interface TestMcpConnectionParams {
  serverConfig: McpServerConfig;
  timeoutMs?: number;
}

export interface TestMcpConnectionResult {
  success: boolean;
  error?: string;
}

const CONSOLE_LOG_PREFIX = 'client-langchain ::';

interface WithTimeoutParams<T> {
  promise: Promise<T>;
  timeoutMs: number;
}

const withTimeout = async <T>({ promise, timeoutMs }: WithTimeoutParams<T>): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};

export const testMcpConnection = async ({
  serverConfig,
  timeoutMs = MCP_TEST_CONNECTION_TIMEOUT_MS,
}: TestMcpConnectionParams): Promise<TestMcpConnectionResult> => {
  const client = new MultiServerMCPClient({
    mcpServers: {
      [serverConfig.serverName]: toMcpAdaptersServerEntry(serverConfig),
    } as Record<string, Connection>,
    throwOnLoadError: true,
  });

  try {
    await withTimeout({
      promise: client.getTools(serverConfig.serverName),
      timeoutMs,
    });

    return { success: true };
  } catch (error) {
    console.error(`${CONSOLE_LOG_PREFIX} testMcpConnection failed`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  } finally {
    await client.close().catch(() => undefined);
  }
};

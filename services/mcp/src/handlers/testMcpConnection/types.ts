import type { ServiceContext } from '../../types';

export interface TestMcpConnectionInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  useSavedSecrets?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

export interface TestMcpConnectionParams {
  input: TestMcpConnectionInput;
  context: ServiceContext;
}

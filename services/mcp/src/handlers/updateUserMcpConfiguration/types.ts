import type { UserMcpConfigResponse } from '@vassembly/domain-user-mcp-config';
import type { ServiceContext } from '../../types';

export interface UpdateUserMcpConfigurationInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface UpdateUserMcpConfigurationParams {
  input: UpdateUserMcpConfigurationInput;
  context: ServiceContext;
}

export type UpdateUserMcpConfigurationResult = UserMcpConfigResponse;

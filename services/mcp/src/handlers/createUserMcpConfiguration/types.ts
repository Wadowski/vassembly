import type { UserMcpConfigResponse } from '@vassembly/domain-user-mcp-config';
import type { ServiceContext } from '../../types';

export interface CreateUserMcpConfigurationInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface CreateUserMcpConfigurationParams {
  input: CreateUserMcpConfigurationInput;
  context: ServiceContext;
}

export type CreateUserMcpConfigurationResult = UserMcpConfigResponse;

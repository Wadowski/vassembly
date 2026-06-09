import type { UserMcpConfigResponse } from '@vassembly/domain-user-mcp-config';
import type { ServiceContext } from '../../types';

export interface GetUserMcpConfigurationInput {
  mcpId: string;
}

export interface GetUserMcpConfigurationParams {
  input: GetUserMcpConfigurationInput;
  context: ServiceContext;
}

export type GetUserMcpConfigurationResult = UserMcpConfigResponse | null;

import type { UserMcpConfigResponse } from '@vassembly/domain-user-mcp-config';
import type { ServiceContext } from '../../types';

export interface ListUserMcpConfigurationsInput {
  limit?: number;
}

export interface ListUserMcpConfigurationsParams {
  input: ListUserMcpConfigurationsInput;
  context: ServiceContext;
}

export type ListUserMcpConfigurationsResult = UserMcpConfigResponse[];

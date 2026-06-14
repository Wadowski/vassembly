import type { ServiceContext } from '../../types';

export interface DeleteUserMcpConfigurationInput {
  mcpId: string;
}

export interface DeleteUserMcpConfigurationResult {
  success: boolean;
}

export interface DeleteUserMcpConfigurationParams {
  input: DeleteUserMcpConfigurationInput;
  context: ServiceContext;
}

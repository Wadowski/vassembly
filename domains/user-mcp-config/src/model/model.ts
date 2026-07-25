import { Model } from '@vassembly/model';

import { USER_MCP_CONFIG_STATUS } from '../constants';
import type { UserMcpConfigStatusValue } from '../constants';

export { USER_MCP_CONFIG_STATUS };

export class UserMcpConfigModel extends Model {
  userId!: string;

  mcpId!: string;

  fieldValues!: Record<string, string | boolean>;

  status!: UserMcpConfigStatusValue;

  enabled!: boolean;

  lastTestedAt?: Date;

  lastConnectionError?: string | null;
}

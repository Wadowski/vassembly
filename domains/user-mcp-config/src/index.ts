import * as commands from './commands';
import * as queries from './queries';
import { UserMcpConfigFactory } from './model/factory';

import type { McpConfigSchema } from './model/configSchema';
import type { UserMcpConfigModel } from './model/model';

export interface ToUserMcpConfigDtoParams {
  model: UserMcpConfigModel;
  configSchema?: McpConfigSchema;
}

export const userMcpConfigDomain = {
  commands,
  queries,
  mappers: {
    toDTO: ({ model, configSchema }: ToUserMcpConfigDtoParams) =>
      UserMcpConfigFactory.toDTO({ model, configSchema }),
  },
};

export default userMcpConfigDomain;

export { UserMcpConfigModel } from './model/model';
export { UserMcpConfigFactory } from './model/factory';
export { McpConfigFieldType } from './model/configSchema';
export type { McpConfigSchema, McpConfigFieldSchema, McpConfigFieldTypeValue } from './model/configSchema';
export { setupUserMcpConfigIndexes, UserMcpConfigDAO } from './clients/mongodb';
export type { McpServerConfig } from './commands/resolveMcpServerConfigs/types';
export * from './types';
export * from './constants';
export { mcpRequiresConfiguration } from './utils/mcpRequiresConfiguration';
export type { McpRequiresConfigurationParams } from './utils/mcpRequiresConfiguration';

import type { RouteDefinition } from '@vassembly/server';

import { createMcpConfigurationRoute } from './createConfiguration';
import { deleteMcpConfigurationRoute } from './deleteConfiguration';
import { testMcpConfigurationRoute } from './testConfiguration';
import { unassignMcpFromAgentRoute } from './unassignAgent';
import { updateMcpConfigurationRoute } from './updateConfiguration';

export {
  createMcpConfigurationBodySchema,
  createMcpConfigurationRoute,
} from './createConfiguration';
export { deleteMcpConfigurationRoute } from './deleteConfiguration';
export {
  testMcpConfigurationBodySchema,
  testMcpConfigurationRoute,
} from './testConfiguration';
export {
  updateMcpConfigurationBodySchema,
  updateMcpConfigurationRoute,
} from './updateConfiguration';
export { unassignMcpFromAgentRoute } from './unassignAgent';

export const mcpConfigurationRoutes: RouteDefinition[] = [
  unassignMcpFromAgentRoute,
  createMcpConfigurationRoute,
  updateMcpConfigurationRoute,
  deleteMcpConfigurationRoute,
  testMcpConfigurationRoute,
];

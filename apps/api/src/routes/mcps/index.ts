import type { RouteDefinition } from '@vassembly/server';

import { createMcpConfigurationRoute } from './createConfiguration';
import { deleteMcpConfigurationRoute } from './deleteConfiguration';
import { testMcpConfigurationRoute } from './testConfiguration';
import { unassignMcpFromAgentRoute } from './unassignAgent';
import { updateMcpConfigurationRoute } from './updateConfiguration';
import { setMcpEnabledRoute } from './setEnabled';

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
export { setMcpEnabledRoute } from './setEnabled';

export const mcpConfigurationRoutes: RouteDefinition[] = [
  unassignMcpFromAgentRoute,
  setMcpEnabledRoute,
  createMcpConfigurationRoute,
  updateMcpConfigurationRoute,
  deleteMcpConfigurationRoute,
  testMcpConfigurationRoute,
];

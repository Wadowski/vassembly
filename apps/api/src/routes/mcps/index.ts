import type { RouteDefinition } from '@vassembly/server';

import { createMcpConfigurationRoute } from './createConfiguration';
import { deleteMcpConfigurationRoute } from './deleteConfiguration';
import { testMcpConfigurationRoute } from './testConfiguration';
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

export const mcpConfigurationRoutes: RouteDefinition[] = [
  createMcpConfigurationRoute,
  updateMcpConfigurationRoute,
  deleteMcpConfigurationRoute,
  testMcpConfigurationRoute,
];

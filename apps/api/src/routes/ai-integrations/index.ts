import type { RouteDefinition } from '@vassembly/server';

import {
  aiIntegrationCreateRoute,
} from './create';
import { aiIntegrationDeleteRoute } from './delete';
import { aiIntegrationGetByIdRoute } from './getById';
import { aiIntegrationListRoute } from './list';
import { aiIntegrationRestoreRoute } from './restore';
import {
  aiIntegrationTestConnectionRoute,
} from './testConnection';
import { aiIntegrationPatchRoute } from './update';

export {
  aiIntegrationCreateBodySchema,
  aiIntegrationCreateRoute,
} from './create';
export { aiIntegrationListQuerySchema, aiIntegrationListRoute } from './list';
export { aiIntegrationGetByIdRoute } from './getById';
export { aiIntegrationPatchBodySchema, aiIntegrationPatchRoute } from './update';
export { aiIntegrationDeleteRoute } from './delete';
export { aiIntegrationRestoreRoute } from './restore';
export {
  aiIntegrationTestConnectionBodySchema,
  aiIntegrationTestConnectionRoute,
} from './testConnection';

export const routes: RouteDefinition[] = [
  aiIntegrationCreateRoute,
  aiIntegrationListRoute,
  aiIntegrationTestConnectionRoute,
  aiIntegrationGetByIdRoute,
  aiIntegrationPatchRoute,
  aiIntegrationDeleteRoute,
  aiIntegrationRestoreRoute,
];

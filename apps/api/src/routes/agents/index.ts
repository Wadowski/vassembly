import type { RouteDefinition } from '@vassembly/server';

import { agentCreateRoute } from './create';
import { agentDeleteRoute } from './delete';
import { agentGetByIdRoute } from './getById';
import { agentInvokeRoute } from './invoke';
import { agentListRoute } from './list';
import { agentRestoreRoute } from './restore';
import { agentPatchRoute } from './update';

export const routes: RouteDefinition[] = [
  agentCreateRoute,
  agentListRoute,
  agentGetByIdRoute,
  agentPatchRoute,
  agentDeleteRoute,
  agentRestoreRoute,
  agentInvokeRoute,
];

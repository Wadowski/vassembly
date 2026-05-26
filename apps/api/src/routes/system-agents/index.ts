import type { RouteDefinition } from '@vassembly/server';

import { systemAgentCreateRoute } from './create';
import { systemAgentDeleteRoute } from './delete';
import { systemAgentGetByIdRoute } from './getById';
import { systemAgentGetPreferenceRoute } from './getConnectionPreference';
import { systemAgentGetUserPreferenceRoute } from './getUserConnectionPreference';
import { systemAgentInvokeRoute } from './invoke';
import { systemAgentListRoute } from './list';
import { systemAgentRestoreRoute } from './restore';
import { systemAgentSetPreferenceRoute } from './setConnectionPreference';
import { systemAgentUpdateRoute } from './update';

export const routes: RouteDefinition[] = [
  systemAgentGetPreferenceRoute,
  systemAgentSetPreferenceRoute,
  systemAgentGetUserPreferenceRoute,
  systemAgentCreateRoute,
  systemAgentListRoute,
  systemAgentGetByIdRoute,
  systemAgentUpdateRoute,
  systemAgentDeleteRoute,
  systemAgentRestoreRoute,
  systemAgentInvokeRoute,
];

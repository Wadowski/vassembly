import type { RouteDefinition } from '@vassembly/server';

import { authRoute } from './auth';
import { logoutRoute } from './logout';
import { refreshRoute } from './refresh';

export const routes: RouteDefinition[] = [authRoute, refreshRoute, logoutRoute];

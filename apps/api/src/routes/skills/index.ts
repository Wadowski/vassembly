import type { RouteDefinition } from '@vassembly/server';

import { skillGetScriptRoute } from './getSkillScript';

export const routes: RouteDefinition[] = [skillGetScriptRoute];

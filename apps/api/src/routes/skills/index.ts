import type { RouteDefinition } from '@vassembly/server';

import { skillArchiveRoute } from './archive';
import { skillCreateRoute } from './create';
import { skillGetScriptRoute } from './getSkillScript';
import { skillUpdateRoute } from './update';

export const routes: RouteDefinition[] = [
  skillCreateRoute,
  skillUpdateRoute,
  skillGetScriptRoute,
  skillArchiveRoute,
];

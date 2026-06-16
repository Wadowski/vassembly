import type { RouteDefinition } from '@vassembly/server';

import { taskCreateRoute } from './create';
import { taskPauseRoute } from './pauseTask';
import { taskResumeRoute } from './resumeTask';
import { taskRetryRoute } from './retryTask';

export const routes: RouteDefinition[] = [
  taskCreateRoute,
  taskPauseRoute,
  taskResumeRoute,
  taskRetryRoute,
];

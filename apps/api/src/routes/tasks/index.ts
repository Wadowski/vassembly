import type { RouteDefinition } from '@vassembly/server';

import { taskCreateRoute } from './create';
import { taskGetQuestionsRoute } from './getTaskQuestions';
import { taskPauseRoute } from './pauseTask';
import { taskResumeRoute } from './resumeTask';
import { taskRetryRoute } from './retryTask';
import { taskSubmitAnswerRoute } from './submitAnswer';

import { taskSubmitCommentRoute } from './submitTaskComment';

export const routes: RouteDefinition[] = [
  taskCreateRoute,
  taskSubmitCommentRoute,
  taskGetQuestionsRoute,
  taskPauseRoute,
  taskResumeRoute,
  taskRetryRoute,
  taskSubmitAnswerRoute,
];

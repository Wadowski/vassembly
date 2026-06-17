import type { TaskDto, TaskQuestionsDto } from '@vassembly/ui-api-hooks';

export type TaskDetailPageView =
  | { phase: 'loading' }
  | { phase: 'notFound' }
  | { phase: 'error'; message: string; onRetry: () => void }
  | { phase: 'ready'; task: TaskDto };

export interface UseTaskDetailPageResult {
  loginRoute: string;
  view: TaskDetailPageView;
  refetchTask: () => Promise<void>;
  taskQuestions: TaskQuestionsDto | undefined;
  isTaskQuestionsLoading: boolean;
  handleAnswerSubmitted: () => Promise<void>;
}

export interface BuildTaskDetailPageViewArgs {
  handleRetry: () => void;
  isNotFound: boolean;
  loadError: string | undefined;
  task: TaskDto | undefined;
}

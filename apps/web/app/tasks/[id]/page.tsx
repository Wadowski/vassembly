'use client';

import { ExecutionProgressTracker } from '@vassembly/ui-execution-progress-tracker';
import { useUserAuth } from '@vassembly/ui-user-auth';

import { LinkedSpecializations } from '../../_components/LinkedSpecializations/LinkedSpecializations';
import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';
import { TaskDetailAiResponse } from './_components/TaskDetailAiResponse/TaskDetailAiResponse';
import { TaskDetailDescription } from './_components/TaskDetailDescription';
import { TaskDetailExecutionError } from './_components/TaskDetailExecutionError/TaskDetailExecutionError';
import { TaskDetailError } from './_components/TaskDetailError';
import { TaskDetailHeader } from './_components/TaskDetailHeader';
import { TaskQuestionForm } from './_components/TaskQuestionForm';
import { TaskQuestionsHistory } from './_components/TaskQuestionsHistory';
import styles from './TaskDetailPage.module.scss';
import { TaskDetailSkeleton } from './TaskDetailSkeleton';
import { useTaskDetailPage } from './useTaskDetailPage';

export default function TaskDetailPage(): JSX.Element {
  const { role } = useUserAuth();
  const isAdmin = role.trim().toLowerCase() === 'admin';
  const {
    loginRoute,
    view,
    refetchTask,
    taskQuestions,
    handleAnswerSubmitted,
    handleSubmitError,
  } = useTaskDetailPage();

  const body =
    view.phase === 'loading' ? (
      <TaskDetailSkeleton />
    ) : view.phase === 'notFound' ? (
      <TaskDetailError variant="notFound" />
    ) : view.phase === 'error' ? (
      <TaskDetailError variant="error" message={view.message} onRetry={view.onRetry} />
    ) : (
      <main className={styles.pageStack}>
        <TaskDetailHeader task={view.task} onTaskUpdated={refetchTask} />
        {taskQuestions !== undefined && taskQuestions.pendingQuestions.length > 0 ? (
          <TaskQuestionForm
            taskId={view.task.id}
            questions={taskQuestions.pendingQuestions}
            onAnswerSubmitted={handleAnswerSubmitted}
            onSubmitError={handleSubmitError}
          />
        ) : null}
        <article className={styles.contentColumn}>
          <LinkedSpecializations
            specializationIds={view.task.specializationIds ?? []}
            isAdmin={isAdmin}
          />
          <TaskDetailAiResponse task={view.task} />
          <TaskDetailDescription description={view.task.description} />
          {taskQuestions !== undefined && taskQuestions.answeredQuestions.length > 0 ? (
            <TaskQuestionsHistory questions={taskQuestions.answeredQuestions} />
          ) : null}
          <TaskDetailExecutionError task={view.task} />
          <ExecutionProgressTracker
            taskId={view.task.id}
            taskStatus={view.task.status}
            hasAssignedAgent={view.task.agentAssignedId !== null}
            answeredQuestions={taskQuestions?.answeredQuestions}
            onTaskCompleted={() => {
              void refetchTask();
            }}
          />
        </article>
      </main>
    );

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={loginRoute} loadingFallback={<TaskDetailSkeleton />}>
      {body}
    </ProtectedAuthRoute>
  );
}

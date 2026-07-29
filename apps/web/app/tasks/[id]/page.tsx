'use client';

import { useCallback, useState } from 'react';

import { useUserAuth } from '@vassembly/ui-user-auth';
import type { SubmitTaskCommentResponse } from '@vassembly/ui-api-hooks';

import { LinkedSpecializations } from '../../_components/LinkedSpecializations/LinkedSpecializations';
import { TaskDetailSkillsUsed } from './_components/TaskDetailSkillsUsed';
import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';
import { TaskActivityFeed } from './_components/TaskActivityFeed/TaskActivityFeed';
import { TaskCommentComposer } from './_components/TaskCommentComposer/TaskCommentComposer';
import { TaskDetailDescription } from './_components/TaskDetailDescription';
import { TaskDetailExecutionError } from './_components/TaskDetailExecutionError/TaskDetailExecutionError';
import { TaskDetailError } from './_components/TaskDetailError';
import { TaskDetailHeader } from './_components/TaskDetailHeader';
import { TaskExecutionStatistics } from './_components/TaskExecutionStatistics/TaskExecutionStatistics';
import { TaskQuestionForm } from './_components/TaskQuestionForm';
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

  const [pendingUserComment, setPendingUserComment] = useState<
    SubmitTaskCommentResponse['comment'] | null
  >(null);

  const handleTaskUpdated = useCallback((): void => {
    void refetchTask();
  }, [refetchTask]);

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
          <TaskDetailSkillsUsed
            skillIds={view.task.skillIdsUsed ?? []}
            isAdmin={isAdmin}
          />
          <TaskDetailDescription description={view.task.description} />
          <TaskCommentComposer
            taskId={view.task.id}
            taskStatus={view.task.status}
            onSubmitted={(response) => {
              setPendingUserComment(response.comment);
              void refetchTask();
            }}
          />
          <TaskActivityFeed
            taskId={view.task.id}
            taskStatus={view.task.status}
            activeCommentId={view.task.activeCommentId}
            pendingUserComment={pendingUserComment}
            onPendingUserCommentSynced={() => {
              setPendingUserComment(null);
            }}
            onTaskUpdated={handleTaskUpdated}
            isAdmin={isAdmin}
          />
          <TaskExecutionStatistics
            taskId={view.task.id}
            commentId={view.task.activeCommentId}
            taskStatus={view.task.status}
          />
          <TaskDetailExecutionError task={view.task} />
        </article>
      </main>
    );

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={loginRoute} loadingFallback={<TaskDetailSkeleton />}>
      {body}
    </ProtectedAuthRoute>
  );
}

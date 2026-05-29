'use client';

import { ProtectedAuthRoute } from '../../../lib/auth/ProtectedAuthRoute';
import { TaskDetailDescription } from './_components/TaskDetailDescription';
import { TaskDetailError } from './_components/TaskDetailError';
import { TaskDetailHeader } from './_components/TaskDetailHeader';
import { TaskDetailTimeline } from './_components/TaskDetailTimeline';
import styles from './TaskDetailPage.module.scss';
import { TaskDetailSkeleton } from './TaskDetailSkeleton';
import { useTaskDetailPage } from './useTaskDetailPage';

export default function TaskDetailPage(): JSX.Element {
  const { loginRoute, view } = useTaskDetailPage();

  const body =
    view.phase === 'loading' ? (
      <TaskDetailSkeleton />
    ) : view.phase === 'notFound' ? (
      <TaskDetailError variant="notFound" />
    ) : view.phase === 'error' ? (
      <TaskDetailError variant="error" message={view.message} onRetry={view.onRetry} />
    ) : (
      <main className={styles.pageStack}>
        <TaskDetailHeader task={view.task} />
        <article className={styles.contentColumn}>
          <TaskDetailDescription description={view.task.description} />
          <TaskDetailTimeline task={view.task} />
        </article>
      </main>
    );

  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={loginRoute} loadingFallback={<TaskDetailSkeleton />}>
      {body}
    </ProtectedAuthRoute>
  );
}

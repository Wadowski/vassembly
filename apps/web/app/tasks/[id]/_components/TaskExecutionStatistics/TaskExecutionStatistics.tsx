'use client';

import { useEffect, useState } from 'react';

import {
  isTaskDetailPollable,
  TaskStatus,
  useTaskActivityTimeline,
} from '@vassembly/ui-api-hooks';
import { ProgressHeader, useCommentProgressPolling } from '@vassembly/ui-execution-progress-tracker';

import styles from './TaskExecutionStatistics.module.scss';

export interface TaskExecutionStatisticsProps {
  taskId: string;
  commentId: string | null;
  taskStatus: string;
}

const resolveStatisticsCommentId = ({
  commentId,
  items,
}: {
  commentId: string | null;
  items: { kind: string; commentId?: string | null }[];
}): string | null => {
  if (commentId) {
    return commentId;
  }

  const respondedCommentIds = new Set(
    items
      .filter((item) => item.kind === 'agentResponse' && item.commentId)
      .map((item) => item.commentId as string),
  );

  const openUserComment = items.find(
    (item) =>
      item.kind === 'userComment' &&
      item.commentId &&
      !respondedCommentIds.has(item.commentId),
  );

  return openUserComment?.commentId ?? null;
};

export const TaskExecutionStatistics = ({
  taskId,
  commentId,
  taskStatus,
}: TaskExecutionStatisticsProps): JSX.Element | null => {
  const { fetch } = useTaskActivityTimeline();
  const [resolvedCommentId, setResolvedCommentId] = useState<string | null>(commentId);

  useEffect(() => {
    if (commentId) {
      setResolvedCommentId(commentId);
      return;
    }

    let cancelled = false;

    const load = async (): Promise<void> => {
      const items = await fetch(taskId);
      if (cancelled) {
        return;
      }

      setResolvedCommentId(resolveStatisticsCommentId({ commentId, items }));
    };

    void load();

    const shouldPollForCommentId = isTaskDetailPollable(taskStatus as TaskStatus);

    if (!shouldPollForCommentId) {
      return (): void => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void load();
    }, 3000);

    return (): void => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [commentId, fetch, taskId, taskStatus]);

  const { data } = useCommentProgressPolling({
    taskId,
    commentId: resolvedCommentId ?? '',
    enabled: resolvedCommentId !== null && resolvedCommentId !== '',
  });

  if (!data) {
    return null;
  }

  return (
    <section className={styles.section} data-testid="task-execution-statistics">
      <ProgressHeader
        taskProgress={data}
        taskStatus={
          taskStatus as
            | 'created'
            | 'in-progress'
            | 'waiting'
            | 'done'
            | 'failed'
            | 'paused'
        }
      />
    </section>
  );
};

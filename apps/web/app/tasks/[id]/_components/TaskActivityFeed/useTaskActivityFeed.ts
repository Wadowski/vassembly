import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type TaskActivityFilterGroup,
  type TaskActivityItemDto,
  isTaskDetailPollable,
  type SubmitTaskCommentResponse,
  TaskStatus,
  useTaskActivityTimeline,
} from '@vassembly/ui-api-hooks';

import { mapSubmittedCommentToActivityItem } from './mapSubmittedCommentToActivityItem';

const ALL_FILTER_GROUPS: TaskActivityFilterGroup[] = [
  'comments',
  'responses',
  'questions',
  'agentStarted',
  'agentFinished',
  'agentFailed',
  'agentWaiting',
];

export interface UseTaskActivityFeedParams {
  taskId: string;
  taskStatus: string;
  activeCommentId: string | null;
  pendingUserComment: SubmitTaskCommentResponse['comment'] | null;
  onPendingUserCommentSynced: () => void;
  onTaskUpdated: () => void;
}

export const useTaskActivityFeed = ({
  taskId,
  taskStatus,
  activeCommentId,
  pendingUserComment,
  onPendingUserCommentSynced,
  onTaskUpdated,
}: UseTaskActivityFeedParams): {
  items: TaskActivityItemDto[];
  selectedGroups: TaskActivityFilterGroup[];
  setSelectedGroups: (groups: TaskActivityFilterGroup[]) => void;
  isEmpty: boolean;
} => {
  const { fetch } = useTaskActivityTimeline();
  const [timeline, setTimeline] = useState<TaskActivityItemDto[]>([]);
  const [selectedGroups, setSelectedGroups] =
    useState<TaskActivityFilterGroup[]>(ALL_FILTER_GROUPS);

  const onTaskUpdatedRef = useRef(onTaskUpdated);
  onTaskUpdatedRef.current = onTaskUpdated;

  const loadTimeline = useCallback(async (): Promise<void> => {
    const items = await fetch(taskId);
    setTimeline(items);
  }, [fetch, taskId]);

  const timelineWithPendingComment = useMemo((): TaskActivityItemDto[] => {
    if (pendingUserComment === null) {
      return timeline;
    }

    const isAlreadyInTimeline = timeline.some(
      (item) => item.kind === 'userComment' && item.commentId === pendingUserComment.id,
    );

    if (isAlreadyInTimeline) {
      return timeline;
    }

    const pendingItem = mapSubmittedCommentToActivityItem({ comment: pendingUserComment });

    return [pendingItem, ...timeline];
  }, [pendingUserComment, timeline]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    if (pendingUserComment === null) {
      return;
    }

    void loadTimeline();
  }, [loadTimeline, pendingUserComment]);

  useEffect(() => {
    void loadTimeline();
  }, [activeCommentId, loadTimeline, taskStatus]);

  useEffect(() => {
    if (pendingUserComment === null) {
      return;
    }

    const isSynced = timeline.some(
      (item) => item.kind === 'userComment' && item.commentId === pendingUserComment.id,
    );

    if (isSynced) {
      onPendingUserCommentSynced();
    }
  }, [onPendingUserCommentSynced, pendingUserComment, timeline]);

  useEffect(() => {
    if (!isTaskDetailPollable(taskStatus as TaskStatus)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadTimeline();
      onTaskUpdatedRef.current();
    }, 3000);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [loadTimeline, taskStatus]);

  const items = useMemo(
    () => timelineWithPendingComment.filter((item) => selectedGroups.includes(item.filterGroup)),
    [selectedGroups, timelineWithPendingComment],
  );

  const isEmpty = items.length === 0;

  const handleSetSelectedGroups = useCallback((groups: TaskActivityFilterGroup[]): void => {
    if (groups.length === 0) {
      setSelectedGroups(ALL_FILTER_GROUPS);
      return;
    }

    setSelectedGroups(groups);
  }, []);

  return {
    items,
    selectedGroups,
    setSelectedGroups: handleSetSelectedGroups,
    isEmpty,
  };
};

import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { GET_TASK_ACTIVITY_TIMELINE_QUERY } from './graphql/getTaskActivityTimelineQuery';
import { mapTaskActivityTimeline } from './mapTaskActivityTimeline';

import type { GraphQLTaskActivityTimelineData, TaskActivityItemDto } from './mapTaskActivityTimeline';

interface GetTaskActivityTimelineVariables {
  taskId: string;
}

export const useTaskActivityTimeline = (): {
  fetch: (taskId: string) => Promise<TaskActivityItemDto[]>;
  data: TaskActivityItemDto[];
  isLoading: boolean;
} => {
  const { execute, data: graphQLData, isLoading } = useApolloLazyQuery<
    GraphQLTaskActivityTimelineData,
    GetTaskActivityTimelineVariables
  >(GET_TASK_ACTIVITY_TIMELINE_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => mapTaskActivityTimeline(graphQLData), [graphQLData]);

  const fetch = useCallback(
    async (taskId: string): Promise<TaskActivityItemDto[]> => {
      const result = await execute({ taskId });
      return mapTaskActivityTimeline(result.data);
    },
    [execute],
  );

  return { fetch, data, isLoading };
};

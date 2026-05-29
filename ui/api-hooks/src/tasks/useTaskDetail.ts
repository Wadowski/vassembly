import { useCallback, useMemo } from 'react';

import { NotFoundError } from '@vassembly/errors';

import { useApolloLazyQuery } from '../graphql';

import { GET_TASK_QUERY } from './graphql/getTaskQuery';
import { mapTaskDetailData } from './mapTaskData';
import type { GetTaskVariables, GraphQLGetTaskData, TaskDto } from './types';

export const useTaskDetail = () => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLGetTaskData,
    GetTaskVariables
  >(GET_TASK_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => mapTaskDetailData(graphQLData), [graphQLData]);

  const fetch = useCallback(
    async (id: string): Promise<TaskDto> => {
      const result = await execute({ id });
      const mapped = mapTaskDetailData(result.data);

      if (!mapped) {
        throw new NotFoundError('Task not found');
      }

      return mapped;
    },
    [execute],
  );

  return { data, isLoading, error, fetch };
};

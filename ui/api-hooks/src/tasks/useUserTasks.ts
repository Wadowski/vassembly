import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { LIST_USER_TASKS_QUERY } from './graphql/listUserTasksQuery';
import { mapUserTasksListData } from './mapUserTasksListData';
import type {
  GraphQLUserTasksListData,
  ListUserTasksVariables,
  UserTasksListQuery,
  UserTasksListResponse,
} from './types';

export type { UserTasksListQuery };

export const useUserTasks = () => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLUserTasksListData,
    ListUserTasksVariables
  >(LIST_USER_TASKS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => mapUserTasksListData(graphQLData), [graphQLData]);

  const fetch = useCallback(
    async ({ query }: { query?: UserTasksListQuery }): Promise<UserTasksListResponse | undefined> => {
      const result = await execute({
        page: query?.page,
        size: query?.size,
        search: query?.search,
      });

      return mapUserTasksListData(result.data);
    },
    [execute],
  );

  return { data, isLoading, error, fetch };
};

import { useMemo } from 'react';

import { useApolloQuery } from '../../graphql';
import type { UseApolloQueryState } from '../../graphql/types';
import { isTaskDetailPollable, TASK_QUESTIONS_POLL_INTERVAL_MS } from '../isTaskDetailPollable';

import { GET_TASK_QUESTIONS_QUERY } from './graphql/getTaskQuestionsQuery';
import { mapTaskQuestionsData } from './mapTaskQuestionsData';
import type {
  GetTaskQuestionsVariables,
  GraphQLTaskQuestionsData,
  TaskQuestionsDto,
  UseTaskQuestionsParams,
} from './types';

export type UseTaskQuestionsResult = Omit<
  UseApolloQueryState<GraphQLTaskQuestionsData, GetTaskQuestionsVariables>,
  'data'
> & {
  data: TaskQuestionsDto | undefined;
};

export const useTaskQuestions = ({
  taskId,
  taskStatus,
}: UseTaskQuestionsParams): UseTaskQuestionsResult => {
  const shouldPoll = isTaskDetailPollable(taskStatus) && taskId !== '';

  const { data: graphQLData, isLoading, error, refetch } = useApolloQuery<
    GraphQLTaskQuestionsData,
    GetTaskQuestionsVariables
  >(GET_TASK_QUESTIONS_QUERY, {
    variables: { taskId },
    fetchPolicy: 'network-only',
    pollInterval: shouldPoll ? TASK_QUESTIONS_POLL_INTERVAL_MS : 0,
    withAuth: true,
    skip: taskId === '',
  });

  const data = useMemo(() => mapTaskQuestionsData(graphQLData), [graphQLData]);

  return { data, isLoading, error, refetch };
};

import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type { TestConnectionVariables } from '../formTypes';
import type { TestConnectionResult } from '../types';

export const useTestConnection = (): UseApolloMutationState<TestConnectionResult, TestConnectionVariables> =>
  useHttpMutation<TestConnectionResult, TestConnectionVariables, TestConnectionVariables['body'], TestConnectionResult>({
    path: '/ai-integrations/test-connection',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => response,
    internalErrorMessage: 'Test connection failed',
  });

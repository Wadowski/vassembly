import { useCallback } from 'react';

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';
import { useHttpMutation } from '../http/useHttpMutation';

import type {
  SystemAgentPreferenceMutationData,
  SystemAgentPreferenceVariables,
} from './formTypes';
import type { SystemAgentPreference } from './types';

export const useSystemAgentPreference = () => {
  const httpClient = useHttpClient();
  const requestFn = useCallback(
    async () =>
      httpClient.get<SystemAgentPreference>({
        path: '/system-agents/connection-preference',
        withAuth: true,
      }),
    [httpClient],
  );

  return useFetch({ requestFn });
};

export const useUpsertSystemAgentPreference = () =>
  useHttpMutation<
    SystemAgentPreferenceMutationData,
    SystemAgentPreferenceVariables,
    SystemAgentPreferenceVariables['body'],
    SystemAgentPreference
  >({
    path: '/system-agents/connection-preference',
    method: 'put',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ preference: response }),
    internalErrorMessage: 'Update system agent connection preference failed',
  });

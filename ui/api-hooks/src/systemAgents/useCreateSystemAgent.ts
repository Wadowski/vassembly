import { useHttpMutation } from '../http/useHttpMutation';

import type { SystemAgentCreateMutationData, SystemAgentCreateVariables } from './formTypes';
import type { SystemAgentAdminItem, SystemAgentFormInput } from './types';

export const useCreateSystemAgent = () =>
  useHttpMutation<
    SystemAgentCreateMutationData,
    SystemAgentCreateVariables,
    SystemAgentFormInput,
    SystemAgentAdminItem
  >({
    path: '/system-agents',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ agent: response }),
    internalErrorMessage: 'Create system agent failed',
  });

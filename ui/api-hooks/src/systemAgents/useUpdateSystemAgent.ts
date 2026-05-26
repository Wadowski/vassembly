import { useHttpMutation } from '../http/useHttpMutation';

import type { SystemAgentUpdateMutationData, SystemAgentUpdateVariables } from './formTypes';
import type { SystemAgentAdminItem, SystemAgentFormInput } from './types';

const resolveSystemAgentPath = (variables: SystemAgentUpdateVariables | undefined): string | undefined => {
  const agentId = variables?.id;
  if (agentId === undefined || agentId === '') {
    return undefined;
  }
  return `/system-agents/${agentId}`;
};

export const useUpdateSystemAgent = () =>
  useHttpMutation<
    SystemAgentUpdateMutationData,
    SystemAgentUpdateVariables,
    Partial<SystemAgentFormInput>,
    SystemAgentAdminItem
  >({
    path: '/system-agents',
    resolvePath: resolveSystemAgentPath,
    method: 'patch',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ agent: response }),
    internalErrorMessage: 'Update system agent failed',
  });

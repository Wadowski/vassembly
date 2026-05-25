import { useHttpMutation } from '../http/useHttpMutation';

import type { SystemAgentArchiveMutationData, SystemAgentArchiveVariables } from './formTypes';
import type { SystemAgentAdminItem } from './types';

const resolveSystemAgentPath = (variables: SystemAgentArchiveVariables | undefined): string | undefined => {
  const agentId = variables?.id;
  if (agentId === undefined || agentId === '') {
    return undefined;
  }
  return `/system-agents/${agentId}`;
};

export const useArchiveSystemAgent = () =>
  useHttpMutation<
    SystemAgentArchiveMutationData,
    SystemAgentArchiveVariables,
    Record<string, never>,
    SystemAgentAdminItem
  >({
    path: '/system-agents',
    resolvePath: resolveSystemAgentPath,
    method: 'delete',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (response) => ({ agent: response }),
    internalErrorMessage: 'Archive system agent failed',
  });

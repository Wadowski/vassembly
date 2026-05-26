import { useHttpMutation } from '../http/useHttpMutation';

import type { SystemAgentRestoreMutationData, SystemAgentRestoreVariables } from './formTypes';
import type { SystemAgentAdminItem } from './types';

const resolveRestorePath = (variables: SystemAgentRestoreVariables | undefined): string | undefined => {
  const agentId = variables?.id;
  if (agentId === undefined || agentId === '') {
    return undefined;
  }
  return `/system-agents/${agentId}/restore`;
};

export const useRestoreSystemAgent = () =>
  useHttpMutation<SystemAgentRestoreMutationData, SystemAgentRestoreVariables, Record<string, never>, SystemAgentAdminItem>({
    path: '/system-agents',
    resolvePath: resolveRestorePath,
    method: 'post',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (response) => ({ agent: response }),
    internalErrorMessage: 'Restore system agent failed',
  });

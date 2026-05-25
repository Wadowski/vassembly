import { useHttpMutation } from '../http/useHttpMutation';

import type { SystemAgentInvokeMutationData, SystemAgentInvokeVariables } from './formTypes';
import type { SystemAgentInvokeInput, SystemAgentInvokeResult } from './types';

const resolveInvokePath = (variables: SystemAgentInvokeVariables | undefined): string | undefined => {
  const agentId = variables?.id;
  if (agentId === undefined || agentId === '') {
    return undefined;
  }
  return `/system-agents/${agentId}/invoke`;
};

export const useInvokeSystemAgent = () =>
  useHttpMutation<
    SystemAgentInvokeMutationData,
    SystemAgentInvokeVariables,
    SystemAgentInvokeInput,
    SystemAgentInvokeResult
  >({
    path: '/system-agents',
    resolvePath: resolveInvokePath,
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ result: response }),
    internalErrorMessage: 'Invoke system agent failed',
  });

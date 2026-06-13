import { useHttpMutation } from '../http/useHttpMutation';

import type {
  InvokePersonalAgentInput,
  InvokePersonalAgentMutationData,
  InvokePersonalAgentResult,
  InvokePersonalAgentVariables,
} from './types';

const resolveInvokePath = (variables: InvokePersonalAgentVariables | undefined): string | undefined => {
  const agentId = variables?.id;
  if (agentId === undefined || agentId === '') {
    return undefined;
  }
  return `/agents/${agentId}/invoke`;
};

export const useInvokePersonalAgent = () =>
  useHttpMutation<
    InvokePersonalAgentMutationData,
    InvokePersonalAgentVariables,
    InvokePersonalAgentInput['body'],
    InvokePersonalAgentResult['result']
  >({
    path: '/agents',
    resolvePath: resolveInvokePath,
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ result: response }),
    internalErrorMessage: 'Invoke personal agent failed',
  });

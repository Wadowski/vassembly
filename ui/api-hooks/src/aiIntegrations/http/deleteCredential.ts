import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type { AiIntegrationDeleteMutationData, AiIntegrationDeleteVariables } from '../formTypes';

const resolveCredentialPath = (variables: AiIntegrationDeleteVariables | undefined): string | undefined => {
  const credentialId = variables?.id;
  if (credentialId === undefined || credentialId === '') {
    return undefined;
  }
  return `/ai-integrations/${credentialId}`;
};

export const useAiIntegrationDelete = (): UseApolloMutationState<
  AiIntegrationDeleteMutationData,
  AiIntegrationDeleteVariables
> =>
  useHttpMutation<
    AiIntegrationDeleteMutationData,
    AiIntegrationDeleteVariables,
    Record<string, never>,
    AiIntegrationDeleteMutationData
  >({
    path: '/ai-integrations',
    resolvePath: resolveCredentialPath,
    method: 'delete',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (response) => response,
    internalErrorMessage: 'Delete AI integration failed',
  });

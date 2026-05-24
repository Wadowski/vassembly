import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type { AiIntegrationRestoreMutationData, AiIntegrationRestoreVariables } from '../formTypes';
import type { AiIntegrationCredentialDto } from '../types';

const resolveRestorePath = (variables: AiIntegrationRestoreVariables | undefined): string | undefined => {
  const credentialId = variables?.id;
  if (credentialId === undefined || credentialId === '') {
    return undefined;
  }
  return `/ai-integrations/${credentialId}/restore`;
};

export const useAiIntegrationRestore = (): UseApolloMutationState<
  AiIntegrationRestoreMutationData,
  AiIntegrationRestoreVariables
> =>
  useHttpMutation<
    AiIntegrationRestoreMutationData,
    AiIntegrationRestoreVariables,
    Record<string, never>,
    AiIntegrationCredentialDto
  >({
    path: '/ai-integrations',
    resolvePath: resolveRestorePath,
    method: 'post',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (response) => ({ credential: response }),
    internalErrorMessage: 'Restore AI integration failed',
  });

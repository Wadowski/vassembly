import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type {
  AiIntegrationUpdateMutationData,
  AiIntegrationUpdateVariables,
} from '../formTypes';
import type { AiIntegrationCredentialDto, AiIntegrationUpdateInput } from '../types';

const resolveCredentialPath = (variables: AiIntegrationUpdateVariables | undefined): string | undefined => {
  const credentialId = variables?.id;
  if (credentialId === undefined || credentialId === '') {
    return undefined;
  }
  return `/ai-integrations/${credentialId}`;
};

export const useAiIntegrationUpdate = (): UseApolloMutationState<
  AiIntegrationUpdateMutationData,
  AiIntegrationUpdateVariables
> =>
  useHttpMutation<
    AiIntegrationUpdateMutationData,
    AiIntegrationUpdateVariables,
    AiIntegrationUpdateInput,
    AiIntegrationCredentialDto
  >({
    path: '/ai-integrations',
    resolvePath: resolveCredentialPath,
    method: 'patch',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ credential: response }),
    internalErrorMessage: 'Update AI integration failed',
  });

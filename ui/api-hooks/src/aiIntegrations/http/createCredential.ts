import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type {
  AiIntegrationCreateMutationData,
  AiIntegrationCreateVariables,
} from '../formTypes';
import type { AiIntegrationCredentialDto, AiIntegrationFormInput } from '../types';

export const useAiIntegrationCreate = (): UseApolloMutationState<
  AiIntegrationCreateMutationData,
  AiIntegrationCreateVariables
> =>
  useHttpMutation<
    AiIntegrationCreateMutationData,
    AiIntegrationCreateVariables,
    AiIntegrationFormInput,
    AiIntegrationCredentialDto
  >({
    path: '/ai-integrations',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({ credential: response }),
    internalErrorMessage: 'Create AI integration failed',
  });

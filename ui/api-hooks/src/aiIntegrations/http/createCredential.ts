import type { UseApolloMutationState } from '../../graphql/types';
import { useHttpMutation } from '../../http/useHttpMutation';

import type {
  AiIntegrationCreateMutationData,
  AiIntegrationCreateVariables,
} from '../formTypes';
import type { AiIntegrationCredentialDto, AiIntegrationFormInput } from '../types';

interface AiIntegrationCreateHttpResponse extends AiIntegrationCredentialDto {
  isFirstSystemAgentPreference?: boolean;
}

export const useAiIntegrationCreate = (): UseApolloMutationState<
  AiIntegrationCreateMutationData,
  AiIntegrationCreateVariables
> =>
  useHttpMutation<
    AiIntegrationCreateMutationData,
    AiIntegrationCreateVariables,
    AiIntegrationFormInput,
    AiIntegrationCreateHttpResponse
  >({
    path: '/ai-integrations',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => variables?.body,
    mapResponse: (response) => ({
      credential: response,
      ...(response.isFirstSystemAgentPreference ? { isFirstSystemAgentPreference: true } : {}),
    }),
    internalErrorMessage: 'Create AI integration failed',
  });

import type { UseApolloMutationState } from '../graphql/types';
import { useHttpMutation } from '../http/useHttpMutation';

export interface ChangePasswordMutationVariables {
  input: { currentPassword: string; newPassword: string };
}

export interface ChangePasswordMutationData {
  changePassword: {
    success: boolean;
  };
}

interface ChangePasswordHttpBody {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordHttpResponse {
  success: boolean;
}

export const useChangePassword = (): UseApolloMutationState<
  ChangePasswordMutationData,
  ChangePasswordMutationVariables
> =>
  useHttpMutation<
    ChangePasswordMutationData,
    ChangePasswordMutationVariables,
    ChangePasswordHttpBody,
    ChangePasswordHttpResponse
  >({
    path: '/user/change-password',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: (variables) => {
      if (!variables?.input) {
        return undefined;
      }
      return {
        currentPassword: variables.input.currentPassword,
        newPassword: variables.input.newPassword,
      };
    },
    mapResponse: (res) => ({ changePassword: res }),
    internalErrorMessage: 'Change password failed',
  });

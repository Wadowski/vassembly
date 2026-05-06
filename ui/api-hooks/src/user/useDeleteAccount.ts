import type { UseApolloMutationState } from '../graphql/types';
import { useHttpMutation } from '../http/useHttpMutation';

export interface DeleteAccountMutationData {
  deleteAccount: {
    success: boolean;
  };
}

interface DeleteAccountHttpResponse {
  success: boolean;
}

export const useDeleteAccount = (): UseApolloMutationState<
  DeleteAccountMutationData,
  Record<string, never>
> =>
  useHttpMutation<
    DeleteAccountMutationData,
    Record<string, never>,
    Record<string, never>,
    DeleteAccountHttpResponse
  >({
    path: '/user/delete-account',
    method: 'post',
    withAuth: true,
    mapVariablesToBody: () => ({}),
    mapResponse: (res) => ({ deleteAccount: res }),
    internalErrorMessage: 'Delete account failed',
  });

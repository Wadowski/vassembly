import type { UseApolloMutationState } from '../graphql/types';
import { useHttpMutation } from '../http/useHttpMutation';

export interface UpdateUserProfileMutationVariables {
  input: { firstName?: string; lastName?: string };
}

export interface UpdateUserProfileMutationData {
  updateUserProfile: {
    user: {
      id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      verifiedAt?: string | null;
    };
  };
}

interface UpdateUserProfileHttpBody {
  firstName?: string;
  lastName?: string;
}

interface UpdateUserProfileHttpResponse {
  user: UpdateUserProfileMutationData['updateUserProfile']['user'];
}

export const useUpdateUserProfile = (): UseApolloMutationState<
  UpdateUserProfileMutationData,
  UpdateUserProfileMutationVariables
> =>
  useHttpMutation<
    UpdateUserProfileMutationData,
    UpdateUserProfileMutationVariables,
    UpdateUserProfileHttpBody,
    UpdateUserProfileHttpResponse
  >({
    path: '/user/profile',
    method: 'patch',
    withAuth: true,
    mapVariablesToBody: (variables) => {
      if (!variables?.input) {
        return undefined;
      }
      return {
        firstName: variables.input.firstName,
        lastName: variables.input.lastName,
      };
    },
    mapResponse: (res) => ({ updateUserProfile: res }),
    internalErrorMessage: 'Update profile failed',
  });

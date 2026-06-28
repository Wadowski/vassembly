import { useApolloQuery } from '../graphql';

import { GET_USER_QUERY } from './getUserQuery';

export interface GetUserVariables {
  id: string;
}

export interface GetUserData {
  user: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    verifiedAt?: string | null;
    onboarding?: {
      version: number;
      startedAt?: string | null;
      completedAt?: string | null;
    };
  };
}

interface UseGetUserOptions {
  userId: string;
}

export const useGetUser = ({ userId }: UseGetUserOptions) => {
  return useApolloQuery<GetUserData, GetUserVariables>(GET_USER_QUERY, {
    variables: { id: userId },
    fetchPolicy: 'no-cache',
    withAuth: true,
    skip: !userId,
  });
};

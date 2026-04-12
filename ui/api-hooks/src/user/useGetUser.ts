import { useMemo } from 'react';
import { useApolloQuery } from '../graphql';

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
  };
}

const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      verifiedAt
    }
  }
`;

export const useGetUser = () => {
  const { data, isLoading, error, refetch } = useApolloQuery<GetUserData, GetUserVariables>(
    GET_USER,
    {
      fetchPolicy: 'no-cache',
      withAuth: true,
    },
  );

  const result = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch],
  );

  return result;
};

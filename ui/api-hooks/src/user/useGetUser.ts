import { useCallback, useMemo } from 'react';
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
    },
  );

  // const getUser = useCallback(
  //   ({ id }: GetUserVariables) => execute({ id }),
  //   [execute],
  // );

  const result = useMemo(
    () => ({
      // getUser,
      data,
      isLoading,
      error,
    }),
    [data, isLoading, error],
  );

  return result;
};

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { InternalError } from '@vassembly/errors';

import type { GraphQLClientConfig } from './types';
import { HttpClientConfig } from '../http/types';


const getAuthToken = async (config: GraphQLClientConfig): Promise<string | undefined> => {
  try {
    const token = config.getAuthToken ? await config.getAuthToken() : undefined;
    return token !== undefined && token !== '' ? `Bearer ${token}` : undefined;
  } catch (error) {
    throw new InternalError('Failed to resolve auth token', error);
  }
};

export const createApolloInstance = (config: GraphQLClientConfig): ApolloClient => {
  const httpLink = new HttpLink({
    uri: config.endpoint,
  });

  const authLink = setContext(async (_, { headers }) => {
    const authToken = getAuthToken(config);
    const authorization = authToken ? `Bearer ${authToken}` : undefined;

    return {
      headers: {
        ...config.defaultHeaders,
        ...(headers as Record<string, string>),
        ...(authorization ? { authorization } : {}),
      },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([authLink, httpLink]),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache', errorPolicy: 'none' },
      mutate: { errorPolicy: 'none' },
    },
  });
};

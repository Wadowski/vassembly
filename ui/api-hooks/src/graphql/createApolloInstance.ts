import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { CUSTOM_HEADERS } from '@vassembly/constants';
import { InternalError } from '@vassembly/errors';

import type { GraphQLClientConfig } from './types';

const getAuthToken = async (config: GraphQLClientConfig): Promise<string | undefined> => {
  try {
    const token = config.getAuthToken ? await config.getAuthToken() : undefined;
    return token !== undefined && token !== '' ? `Bearer ${token}` : undefined;
  } catch (error) {
    throw new InternalError('Failed to resolve auth token', error);
  }
};

const getRawTokens = async (config: GraphQLClientConfig): Promise<{ authToken?: string; refreshToken?: string }> => {
  try {
    const [authToken, refreshToken] = await Promise.all([
      config.getAuthToken ? config.getAuthToken() : Promise.resolve(undefined),
      config.getRefreshToken ? config.getRefreshToken() : Promise.resolve(undefined),
    ]);
    return {
      authToken: authToken && authToken !== '' ? authToken : undefined,
      refreshToken: refreshToken && refreshToken !== '' ? refreshToken : undefined,
    };
  } catch (error) {
    throw new InternalError('Failed to resolve auth tokens', error);
  }
};

export const createApolloInstance = (config: GraphQLClientConfig): ApolloClient => {
  const httpLink = new HttpLink({
    uri: config.endpoint,
  });

  const authLink = setContext(async (operation, { headers }) => {
    const authorization = await getAuthToken(config);
    const operationContext = operation.context || {};
    const customHeaders: Record<string, string> = {};

    if (operationContext.withAuth) {
      const tokens = await getRawTokens(config);
      
      if (tokens.authToken) {
        customHeaders[CUSTOM_HEADERS.AuthToken] = tokens.authToken;
      }
      if (tokens.refreshToken) {
        customHeaders[CUSTOM_HEADERS.RefreshToken] = tokens.refreshToken;
      }
    }

    return {
      headers: {
        ...config.defaultHeaders,
        ...(headers as Record<string, string>),
        ...(authorization ? { Authorization: authorization } : {}),
        ...customHeaders,
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

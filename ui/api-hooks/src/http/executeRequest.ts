import { CommonError, InternalError } from '@vassembly/errors';

import { buildUrl } from './buildUrl';
import { mapHttpStatusToError } from './mapHttpStatusToError';
import { mergeHeaders } from './mergeHeaders';
import type { ExecuteRequestProps, HttpClientConfig } from './types';

const getAuthToken = async (config: HttpClientConfig): Promise<string | undefined> => {
  try {
    const token = config.getAuthToken ? await config.getAuthToken() : undefined;
    return token !== undefined && token !== '' ? `Bearer ${token}` : undefined;
  } catch (error) {
    throw new InternalError('Failed to resolve auth token', error);
  }
};

const getRawTokens = async (config: HttpClientConfig): Promise<{ authToken?: string; refreshToken?: string }> => {
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

export const executeRequest = async <TBody, TResponse>({
  config,
  method,
  options,
}: ExecuteRequestProps<TBody>): Promise<TResponse> => {
  const url = buildUrl({
    baseUrl: config.baseUrl ?? '',
    path: options.path,
    query: options.query,
  });
  let authToken: string | undefined;
  let refreshToken: string | undefined;
  let authorization: string | undefined;

  if (options.withAuth) {
    authorization = await getAuthToken(config);
    const tokens = await getRawTokens(config);
    authToken = tokens.authToken;
    refreshToken = tokens.refreshToken;
  }

  const headers = mergeHeaders({
    defaultHeaders: config.defaultHeaders ?? {},
    requestHeaders: options.headers ?? {},
    authorization,
    authToken,
    refreshToken,
    hasBody: options.body !== undefined,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw mapHttpStatusToError({ status: response.status, message: responseJson.message });
    }

    return responseJson as TResponse;
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }

    throw new InternalError('Network request failed', error);
  }
};

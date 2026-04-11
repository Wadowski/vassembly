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
  const authorization = await getAuthToken(config);
  const headers = mergeHeaders({
    defaultHeaders: config.defaultHeaders ?? {},
    requestHeaders: options.headers ?? {},
    authorization,
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

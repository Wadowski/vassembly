import { CUSTOM_HEADERS } from '@vassembly/constants';
import type { MergeHeadersProps } from './types';

export const mergeHeaders = ({
  defaultHeaders,
  requestHeaders,
  authorization,
  authToken,
  refreshToken,
  hasBody = false,
}: MergeHeadersProps): Record<string, string> => {
  const merged: Record<string, string> = { ...defaultHeaders, ...requestHeaders };

  if (hasBody && merged['Content-Type'] === undefined) {
    merged['Content-Type'] = 'application/json';
  }

  if (authorization) {
    merged.Authorization = authorization;
  }

  if (authToken) {
    merged[CUSTOM_HEADERS.AuthToken] = authToken;
  }

  if (refreshToken) {
    merged[CUSTOM_HEADERS.RefreshToken] = refreshToken;
  }

  return merged;
};

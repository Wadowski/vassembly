import type { MergeHeadersProps } from './types';

export const mergeHeaders = ({
  defaultHeaders,
  requestHeaders,
  authorization,
}: MergeHeadersProps): Record<string, string> => {
  const merged: Record<string, string> = { ...defaultHeaders, ...requestHeaders };

  if (authorization) {
    merged.Authorization = authorization;
  }

  return merged;
};

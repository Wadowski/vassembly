import type { BuildUrlProps } from './types';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const ensureLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

export const buildUrl = ({
  baseUrl,
  path,
  query,
}: BuildUrlProps): string => {
  const base = trimTrailingSlash(baseUrl);
  const normalizedPath = ensureLeadingSlash(path);
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

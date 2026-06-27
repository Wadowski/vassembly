import { fetchWithLimits } from './fetchWithLimits';
import { extractPageContent } from './htmlExtraction';
import { assertHttpsUrlAllowed } from './urlGuards';

import type { PageContentClientConfig, WebPageContentResult } from './types';

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_USER_AGENT = 'vassembly-agent/1.0';
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export interface PageContentClient {
  fetch: ({ url }: { url: string }) => Promise<WebPageContentResult>;
}

export const createPageContentClient = (config?: PageContentClientConfig): PageContentClient => {
  const maxBytes = config?.maxBytes ?? DEFAULT_MAX_BYTES;
  const userAgent = config?.userAgent ?? DEFAULT_USER_AGENT;
  const fetchFn = config?.fetchFn ?? fetch;
  const requestTimeoutMs = config?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  return {
    fetch: async ({ url }: { url: string }): Promise<WebPageContentResult> => {
      const parsedUrl = assertHttpsUrlAllowed({ url });
      const { html, finalUrl } = await fetchWithLimits({
        url: parsedUrl.href,
        fetchFn,
        userAgent,
        maxBytes,
        requestTimeoutMs,
      });

      return extractPageContent({
        html,
        baseUrl: finalUrl,
      });
    },
  };
};

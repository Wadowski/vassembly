import { readResponseTextWithLimit } from './fetchWithLimits';
import { parse } from 'node-html-parser';

import type { WebSearchClientConfig, WebSearchResponse, WebSearchResult } from './types';

const DUCKDUCKGO_HTML_URL = 'https://html.duckduckgo.com/html/';
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_USER_AGENT = 'vassembly-agent/1.0';
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

export interface WebSearchClient {
  search: ({ query }: { query: string }) => Promise<WebSearchResponse>;
}

const resolveResultUrl = ({ href }: { href: string }): string => {
  try {
    const parsed = new URL(href, DUCKDUCKGO_HTML_URL);
    const redirectTarget = parsed.searchParams.get('uddg');

    if (redirectTarget) {
      return decodeURIComponent(redirectTarget);
    }

    return parsed.href;
  } catch {
    return href;
  }
};

const parseSearchResults = ({
  html,
  maxResults,
}: {
  html: string;
  maxResults: number;
}): WebSearchResult[] => {
  const root = parse(html);
  const results: WebSearchResult[] = [];

  for (const resultBlock of root.querySelectorAll('.result')) {
    const titleLink = resultBlock.querySelector('a.result__a');
    const snippetNode =
      resultBlock.querySelector('a.result__snippet') ??
      resultBlock.querySelector('.result__snippet');

    const title = titleLink?.text.trim() ?? '';
    const href = titleLink?.getAttribute('href') ?? '';
    const snippet = snippetNode?.text.trim() ?? '';

    if (!title || !href) {
      continue;
    }

    results.push({
      title,
      url: resolveResultUrl({ href }),
      snippet,
    });

    if (results.length >= maxResults) {
      break;
    }
  }

  return results;
};

export const createWebSearchClient = (config?: WebSearchClientConfig): WebSearchClient => {
  const maxResults = config?.maxResults ?? DEFAULT_MAX_RESULTS;
  const userAgent = config?.userAgent ?? DEFAULT_USER_AGENT;
  const fetchFn = config?.fetchFn ?? fetch;
  const requestTimeoutMs = config?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  return {
    search: async ({ query }: { query: string }): Promise<WebSearchResponse> => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return { results: [] };
      }

      const body = new URLSearchParams({ q: trimmedQuery });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const response = await fetchFn(DUCKDUCKGO_HTML_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent,
            Accept: 'text/html',
          },
          body: body.toString(),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        const html = await readResponseTextWithLimit({
          response,
          maxBytes: DEFAULT_MAX_BYTES,
        });

        return {
          results: parseSearchResults({ html, maxResults }),
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Search request timed out');
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
};

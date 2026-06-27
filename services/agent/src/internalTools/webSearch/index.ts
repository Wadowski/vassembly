import { createWebSearchClient } from '@vassembly/client-web';

import type { WebSearchParams } from './types';

export const webSearch = async ({ args }: WebSearchParams): Promise<string> => {
  const query = typeof args.query === 'string' ? args.query.trim() : '';

  if (!query) {
    return 'Unable to search the web: query is required';
  }

  try {
    const client = createWebSearchClient();
    const { results } = await client.search({ query });

    return JSON.stringify(results);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    return `Unable to search the web: ${reason}`;
  }
};

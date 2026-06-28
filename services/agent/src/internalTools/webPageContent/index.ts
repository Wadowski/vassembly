import { createPageContentClient } from '@vassembly/client-web';

import type { WebPageContentParams } from './types';

export const webPageContent = async ({ args }: WebPageContentParams): Promise<string> => {
  const url = typeof args.url === 'string' ? args.url.trim() : '';

  if (!url) {
    return 'Unable to fetch page content: url is required';
  }

  try {
    const client = createPageContentClient();
    const result = await client.fetch({ url });

    return JSON.stringify(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    return `Unable to fetch page content: ${reason}`;
  }
};

import type { FetchWithLimitsParams, FetchWithLimitsResult } from './types';

export const readResponseTextWithLimit = async ({
  response,
  maxBytes,
}: {
  response: Response;
  maxBytes: number;
}): Promise<string> => {
  const contentLengthHeader = response.headers.get('content-length');

  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);

    if (!Number.isNaN(contentLength) && contentLength > maxBytes) {
      throw new Error('Response exceeds maximum allowed size');
    }
  }

  const body = response.body;

  if (!body) {
    return '';
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error('Response exceeds maximum allowed size');
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();

  return text;
};

export const fetchWithLimits = async ({
  url,
  fetchFn,
  userAgent,
  maxBytes,
  requestTimeoutMs,
}: FetchWithLimitsParams): Promise<FetchWithLimitsResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetchFn(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const html = await readResponseTextWithLimit({ response, maxBytes });

    return {
      html,
      finalUrl: response.url || url,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export interface WebSearchClientConfig {
  maxResults?: number;
  userAgent?: string;
  fetchFn?: typeof fetch;
  requestTimeoutMs?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
}

export interface PageContentClientConfig {
  maxBytes?: number;
  userAgent?: string;
  fetchFn?: typeof fetch;
  requestTimeoutMs?: number;
}

export interface WebPageContentResult {
  url: string;
  text: string;
  images: string[];
  videos: string[];
}

export interface ExtractPageContentParams {
  html: string;
  baseUrl: string;
}

export interface FetchWithLimitsParams {
  url: string;
  fetchFn: typeof fetch;
  userAgent: string;
  maxBytes: number;
  requestTimeoutMs: number;
}

export interface FetchWithLimitsResult {
  html: string;
  finalUrl: string;
}

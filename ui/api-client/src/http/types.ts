export type QueryParamValue = string | number | boolean | null | undefined;

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | undefined | Promise<string | undefined>;
  defaultTimeoutMs?: number;
}

export interface RequestOptions<TBody = unknown> {
  path: string;
  body?: TBody;
  query?: Record<string, QueryParamValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface HttpClient {
  get: <TResponse>(options: RequestOptions<never>) => Promise<TResponse>;
  post: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  put: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  patch: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  delete: <TResponse>(options: RequestOptions<never>) => Promise<TResponse>;
}

export interface BuildUrlProps {
  baseUrl: string;
  path: string;
  query?: Record<string, QueryParamValue>;
}

export interface MergeHeadersProps {
  defaultHeaders?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  authorization?: string;
}

export interface ResolveFetchSignalProps {
  userSignal?: AbortSignal;
  timeoutMs?: number;
}

export interface ResolveFetchSignalResult {
  signal: AbortSignal | undefined;
  timeoutController: AbortController | undefined;
  timeoutId: ReturnType<typeof setTimeout> | undefined;
}

export interface ToAbortErrorProps {
  userSignal?: AbortSignal;
  timeoutController?: AbortController;
}
export interface ExecuteRequestProps<TBody> {
  config: HttpClientConfig;
  method: string;
  options: RequestOptions<TBody>;
}
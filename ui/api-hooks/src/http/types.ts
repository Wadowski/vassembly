import type { CommonError } from '@vassembly/errors';

export interface HttpClient {
  get: <TResponse>(options: RequestOptions<never>) => Promise<TResponse>;
  post: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  put: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  patch: <TBody, TResponse>(options: RequestOptions<TBody>) => Promise<TResponse>;
  delete: <TResponse>(options: RequestOptions<never>) => Promise<TResponse>;
}

export interface HttpClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => Promise<string | undefined>;
}

export interface RequestOptions<TBody> {
  path: string;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: TBody;
}

export interface ExecuteRequestProps<TBody> {
  config: HttpClientConfig;
  method: string;
  options: RequestOptions<TBody>;
}

export interface UseQueryOptions<TResponse> {
  requestFn: () => Promise<TResponse>;
  deps: unknown[];
  enabled?: boolean;
}

export interface UseQueryState<TResponse> {
  data: TResponse | undefined;
  isLoading: boolean;
  error: CommonError | undefined;
  refetch: () => Promise<void>;
}

export interface UseMutationOptions<TParams, TResponse> {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: CommonError) => void;
}

export interface UseMutationState<TParams, TResponse> {
  mutate: (params: TParams) => Promise<TResponse | undefined>;
  isLoading: boolean;
  error: CommonError | undefined;
  data: TResponse | undefined;
}

export interface HttpClientContextValue {
  client: HttpClient | undefined;
}

export interface HttpClientProviderProps {
  config: HttpClientConfig;
  children: React.ReactNode;
}

export interface BuildUrlProps {
  baseUrl: string;
  path: string;
  query?: Record<string, string | number | boolean>;
}

export interface MergeHeadersProps {
  defaultHeaders: Record<string, string>;
  requestHeaders: Record<string, string>;
  authorization: string | undefined;
}

import { executeRequest } from './executeRequest';
import type { HttpClient, HttpClientConfig, RequestOptions } from './types';

export const createHttpClient = (config: HttpClientConfig): HttpClient => ({
  get: <TResponse>(options: RequestOptions<never>) =>
    executeRequest<never, TResponse>({ config, method: 'GET', options }),

  post: <TBody, TResponse>(options: RequestOptions<TBody>) =>
    executeRequest<TBody, TResponse>({ config, method: 'POST', options }),

  put: <TBody, TResponse>(options: RequestOptions<TBody>) =>
    executeRequest<TBody, TResponse>({ config, method: 'PUT', options }),

  patch: <TBody, TResponse>(options: RequestOptions<TBody>) =>
    executeRequest<TBody, TResponse>({ config, method: 'PATCH', options }),

  delete: <TResponse>(options: RequestOptions<never>) =>
    executeRequest<never, TResponse>({ config, method: 'DELETE', options }),
});

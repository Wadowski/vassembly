import { createContext, ReactNode, useMemo } from 'react';
import type { HttpClientConfig, HttpClient } from './types';
import { createHttpClient } from './client';

export const HttpClientContext = createContext<HttpClient | undefined>(undefined);

interface HttpClientProviderProps {
  config: HttpClientConfig;
  children: ReactNode;
}

export const HttpClientProvider = ({ config, children }: HttpClientProviderProps) => {
  const client = useMemo(() => createHttpClient(config), [config]);

  return <HttpClientContext.Provider value={client}>{children}</HttpClientContext.Provider>;
};

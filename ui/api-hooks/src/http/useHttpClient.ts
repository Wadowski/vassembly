import { useContext } from 'react';
import type { HttpClient } from './types';
import { HttpClientContext } from './HttpClientContext';

export const useHttpClient = (): HttpClient => {
  const client = useContext(HttpClientContext);

  if (!client) {
    throw new Error('useHttpClient must be used within HttpClientProvider');
  }

  return client;
};

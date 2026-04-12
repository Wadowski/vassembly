
import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface RefreshResponse {
  token: string;
  id?: string;
}

export const useRefresh = () => {
  const httpClient = useHttpClient();

  return useFetch<RefreshResponse, never>({
    requestFn: () => httpClient.post({ path: '/user/refresh', withAuth: true }),
  });
};

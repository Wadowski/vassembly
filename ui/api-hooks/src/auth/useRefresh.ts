
import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface RefreshParams {
  refreshToken: string;
}

interface RefreshResponse {
  token: string;
  id?: string;
}

export const useRefresh = (params: RefreshParams) => {
  const httpClient = useHttpClient();

  return useFetch<RefreshResponse>({
    requestFn: () => httpClient.post({ path: '/user/refresh', body: params }),
    deps: [],
  });
};

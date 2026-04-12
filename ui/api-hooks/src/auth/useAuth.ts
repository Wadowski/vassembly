import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

export const useAuth = () => {
  const httpClient = useHttpClient();

  return useFetch<AuthResponse>({
    requestFn: () => httpClient.post({ path: '/auth', body: {} }),
    deps: [],
  });
};

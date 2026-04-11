import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface AuthParams {}

interface AuthResponse {
  token: string;
  refreshToken: string;
}

export const useAuth = () => {
  const httpClient = useHttpClient();

  return useFetch<AuthResponse>({
    requestFn: () => httpClient.post({ path: '/user/auth', body: {} }),
    deps: [],
  });
};

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

export const useAuth = () => {
  const httpClient = useHttpClient();

  return useFetch<AuthResponse, never>({
    requestFn: () => httpClient.post({ path: '/auth', withAuth: true }),
  });
};

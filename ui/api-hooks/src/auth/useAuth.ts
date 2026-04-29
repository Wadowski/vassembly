import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

export const useAuth = () => {
  const httpClient = useHttpClient();

  return useFetch<AuthResponse, { body: {} }>({
    requestFn: ({ body }) => httpClient.post({ path: '/auth', body, withAuth: true }),
  });
};

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface LogoutResponse {
  ok: boolean;
}

export const useLogout = () => {
  const httpClient = useHttpClient();

  return useFetch<LogoutResponse, { body: {} }>({
    requestFn: ({ body }) => httpClient.post({ path: '/auth/logout', body, withAuth: true }),
  });
};

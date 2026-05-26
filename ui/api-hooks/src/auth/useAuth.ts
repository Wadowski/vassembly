import { AUTH_TOKEN_ROLE } from '@vassembly/constants';

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface AuthResponse {
  authToken: string;
  refreshToken: string;
  data: {
    userId: string;
    role: AUTH_TOKEN_ROLE;
    refreshTokenId: string;
  };
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    verifiedAt?: string;
    role?: string;
  };
}

export const useAuth = () => {
  const httpClient = useHttpClient();

  return useFetch<AuthResponse, object>({
    requestFn: ({ body }) => httpClient.post({ path: '/auth', body, withAuth: true }),
  });
};

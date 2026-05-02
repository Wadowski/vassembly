import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';
import { enums } from '@vassembly/domain-auth-token';

interface AuthResponse {
  authToken: string;
  refreshToken: string;
  data: {
    userId: string;
    role: enums.AuthTokenRole;
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

  return useFetch<AuthResponse, { body: {} }>({
    requestFn: ({ body }) => httpClient.post({ path: '/auth', body, withAuth: true }),
  });
};

import { useHttpClient } from '../http/useHttpClient';
import { useFetch } from '../http/useFetch';

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  authToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    verifiedAt?: Date | null;
  };
  requiresEmailVerification?: boolean;
}


export const useRegister = () => {
  const httpClient = useHttpClient();

  return useFetch<RegisterResponse, RegisterParams>({
    requestFn: ({ body }) => httpClient.post({ path: '/user/register', body }),
  });
};

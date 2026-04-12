import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface LoginParams {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    verifiedAt?: Date | null;
  };
  authToken: string;
  refreshToken: string;
}


export const useLogin = () => {
  const httpClient = useHttpClient();

  return useFetch<LoginResponse, LoginParams>({
    requestFn: ({ body }) => httpClient.post({ path: '/user/login', body }),
  });
};

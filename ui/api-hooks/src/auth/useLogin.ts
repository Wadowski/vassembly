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


export const useLogin = (params: LoginParams) => {
  const httpClient = useHttpClient();

  return useFetch<LoginResponse>({
    requestFn: () => httpClient.post({ path: '/user/login', body: params }),
    deps: [],
  });
};

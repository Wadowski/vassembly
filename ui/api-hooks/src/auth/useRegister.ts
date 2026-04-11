import { useHttpClient } from '../http/useHttpClient';
import { useFetch } from '../http/useFetch';

export interface RegisterParams {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    verifiedAt?: Date | null;
  };
}


export const useRegister = (params: RegisterParams) => {
  const httpClient = useHttpClient();

  return useFetch<RegisterResponse>({
    requestFn: () => httpClient.post({ path: '/user/register', body: params }),
    deps: [],
  });
};

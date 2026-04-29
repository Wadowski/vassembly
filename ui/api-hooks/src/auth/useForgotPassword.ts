import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface ForgotPasswordParams {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  message?: string;
}

export const useForgotPassword = () => {
  const httpClient = useHttpClient();

  return useFetch<ForgotPasswordResponse, ForgotPasswordParams>({
    requestFn: ({ body }) => httpClient.post({ path: '/user/forgot-password', body }),
  });
};

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

interface VerifyEmailParams {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export const useVerifyEmail = () => {
  const httpClient = useHttpClient();

  return useFetch<VerifyEmailResponse, VerifyEmailParams>({
    requestFn: ({ body }) =>
      httpClient.post({ path: '/auth/verify-email', body, withAuth: true }),
  });
};

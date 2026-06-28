import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

export interface ResendVerificationResponse {
  success: boolean;
}

export const useResendVerification = () => {
  const httpClient = useHttpClient();

  return useFetch<ResendVerificationResponse, never>({
    requestFn: () =>
      httpClient.post({ path: '/auth/resend-verification', withAuth: true }),
  });
};

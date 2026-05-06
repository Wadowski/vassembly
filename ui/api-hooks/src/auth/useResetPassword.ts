import { WrongParamError } from '@vassembly/errors';
import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

export interface ResetPasswordParams {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  user: {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    removedAt?: Date | null;
    email?: string;
    firstName?: string;
    lastName?: string;
    verifiedAt?: Date | null;
  };
}

const assertResetPasswordParams = (params: ResetPasswordParams | undefined): void => {
  if (params === undefined) {
    throw new WrongParamError('Token is required');
  }
  const { token, password } = params;
  if (!token.trim()) {
    throw new WrongParamError('Token is required');
  }
  if (!password.length) {
    throw new WrongParamError('Password is required');
  }
};

export const useResetPassword = () => {
  const httpClient = useHttpClient();
  const { data, isLoading, error, fetch } = useFetch<ResetPasswordResponse, ResetPasswordParams>({
    requestFn: async ({ body }) => {
      assertResetPasswordParams(body);
      return httpClient.post<ResetPasswordParams, ResetPasswordResponse>({
        path: '/user/reset-password',
        body,
      });
    },
  });

  const mutate = async (params: ResetPasswordParams): Promise<void> => {
    await fetch({ body: params });
  };

  return { data, mutate, isPending: isLoading, error };
};

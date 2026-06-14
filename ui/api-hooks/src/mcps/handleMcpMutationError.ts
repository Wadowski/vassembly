import { CommonError, InternalError, UnauthorizedError, WrongParamError } from '@vassembly/errors';

export interface HandleMcpMutationErrorParams {
  err: unknown;
  setError: (error: CommonError) => void;
  defaultMessage: string;
}

export const handleMcpMutationError = ({
  err,
  setError,
  defaultMessage,
}: HandleMcpMutationErrorParams): never | undefined => {
  if (err instanceof UnauthorizedError) {
    setError(err);
    return undefined;
  }

  if (err instanceof WrongParamError) {
    setError(err);
    throw err;
  }

  if (err instanceof CommonError) {
    setError(err);
    throw err;
  }

  const error = new InternalError(defaultMessage, err);
  setError(error);
  throw error;
};

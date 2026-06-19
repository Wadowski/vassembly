import {
  ConflictError,
  CommonError,
  ErrorTypes,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  WrongParamError,
} from '@vassembly/errors';

const statusToError: Record<number, (message: string) => CommonError> = {
  400: (message) => new WrongParamError(message),
  401: (message) => new UnauthorizedError(message),
  403: (message) => new ForbiddenError(message),
  404: (message) => new NotFoundError(message),
  409: (message) => new ConflictError(message),
  429: (message) => new TooManyRequestsError(message),
};

export const mapHttpStatusToError = ({
  status,
  message,
}: {
  status: number;
  message: string;
}): CommonError => {
  const mapped = statusToError[status];

  if (mapped) {
    return mapped(message);
  }

  if (status >= 500 && status <= 599) {
    return new InternalError(message);
  }

  if (status >= 400 && status <= 499) {
    return new CommonError(status, ErrorTypes.WRONG_PARAM, message);
  }

  return new InternalError(message);
};

export enum ErrorTypes {
  WRONG_PARAM = 'WRONG_PARAM',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export const ErrorStatusCodes: Record<ErrorTypes, number> = {
  [ErrorTypes.WRONG_PARAM]: 400,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.UNAUTHORIZED]: 401,
  [ErrorTypes.FORBIDDEN]: 403,
  [ErrorTypes.INTERNAL_ERROR]: 500,
  [ErrorTypes.TIMEOUT]: 408,
};
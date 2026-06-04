const RATE_LIMIT_MESSAGE = 'Too many requests. Please try again later.';
const UNAUTHORIZED_STATUS = 401;
const TOO_MANY_REQUESTS_STATUS = 429;
const TOO_MANY_REQUESTS_TYPE = 'TOO_MANY_REQUESTS';

export const getTaskErrorMessage = (error: unknown, fallback: string): string => {
  if (error !== null && error !== undefined && typeof error === 'object') {
    const record = error as { message?: string; statusCode?: number; type?: string };
    if (
      record.statusCode === TOO_MANY_REQUESTS_STATUS ||
      record.type === TOO_MANY_REQUESTS_TYPE
    ) {
      return RATE_LIMIT_MESSAGE;
    }
    if (typeof record.message === 'string' && record.message.trim() !== '') {
      return record.message;
    }
  }
  return fallback;
};

export const isUnauthorizedTaskError = (error: unknown): boolean => {
  if (error === null || error === undefined || typeof error !== 'object') {
    return false;
  }
  return (error as { statusCode?: number }).statusCode === UNAUTHORIZED_STATUS;
};

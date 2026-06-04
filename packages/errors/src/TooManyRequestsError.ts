import { CommonError } from './Error';
import { ErrorStatusCodes, ErrorTypes } from './errorTypes';

export interface TooManyRequestsErrorOptions {
  retryAfterSeconds?: number;
}

export class TooManyRequestsError extends CommonError {
  retryAfterSeconds?: number;

  static [Symbol.hasInstance](instance: unknown): boolean {
    return (
      typeof instance === 'object' &&
      instance !== null &&
      'type' in instance &&
      (instance as CommonError).type === ErrorTypes.TOO_MANY_REQUESTS &&
      (instance as CommonError).statusCode === ErrorStatusCodes[ErrorTypes.TOO_MANY_REQUESTS]
    );
  }

  constructor(message = 'Too many requests', options?: TooManyRequestsErrorOptions | number) {
    super(
      ErrorStatusCodes[ErrorTypes.TOO_MANY_REQUESTS],
      ErrorTypes.TOO_MANY_REQUESTS,
      message,
    );
    this.retryAfterSeconds = typeof options === 'number' ? options : options?.retryAfterSeconds;
  }
}

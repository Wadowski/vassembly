import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class UnauthorizedError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(ErrorStatusCodes[ErrorTypes.UNAUTHORIZED], ErrorTypes.UNAUTHORIZED, message, error);
  }
}

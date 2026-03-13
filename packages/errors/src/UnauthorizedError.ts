import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class UnauthorizedError extends CommonError {
  constructor(message: string, error?: any) {
    super(ErrorStatusCodes[ErrorTypes.UNAUTHORIZED], ErrorTypes.UNAUTHORIZED, message, error);
  }
}

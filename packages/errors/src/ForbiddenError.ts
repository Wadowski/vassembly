import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class ForbiddenError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(ErrorStatusCodes[ErrorTypes.FORBIDDEN], ErrorTypes.FORBIDDEN, message, error);
  }
}

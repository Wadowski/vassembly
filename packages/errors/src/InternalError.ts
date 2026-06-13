import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class InternalError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(ErrorStatusCodes[ErrorTypes.INTERNAL_ERROR], ErrorTypes.INTERNAL_ERROR, message, error);
  }
}

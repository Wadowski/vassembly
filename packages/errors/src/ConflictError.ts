import { CommonError } from './Error';
import { ErrorStatusCodes, ErrorTypes } from './errorTypes';

export class ConflictError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(ErrorStatusCodes[ErrorTypes.CONFLICT], ErrorTypes.CONFLICT, message, error);
  }
}

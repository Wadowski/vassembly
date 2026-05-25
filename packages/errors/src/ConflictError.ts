import { CommonError } from './Error';
import { ErrorTypes } from './errorTypes';

export class ConflictError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(409, ErrorTypes.VALIDATION, message, error);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

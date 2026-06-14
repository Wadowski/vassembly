import { CommonError } from './Error';
import { ErrorTypes } from './errorTypes';

export class WrongParamError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(400, ErrorTypes.WRONG_PARAM, message, error);
    Object.setPrototypeOf(this, WrongParamError.prototype);
  }
}


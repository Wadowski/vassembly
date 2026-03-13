import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class TimeoutError extends CommonError {
  constructor(message: string, error?: any) {
    super(ErrorStatusCodes[ErrorTypes.TIMEOUT], ErrorTypes.TIMEOUT, message, error);
  }
}

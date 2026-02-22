import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';

export class NotFoundError extends CommonError {
  constructor(message: string, error?: any) {
    super(ErrorStatusCodes[ErrorTypes.NOT_FOUND], ErrorTypes.NOT_FOUND, message, error);
  }
}

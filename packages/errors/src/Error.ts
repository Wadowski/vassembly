import { CommonError as ICommonError } from './types';
import { ErrorTypes } from './errorTypes';

export class CommonError extends Error implements ICommonError {
  statusCode: number;
  type: ErrorTypes;
  declare message: string;
  error?: any;

  constructor(statusCode: number, type: ErrorTypes, message: string, error?: any) {
    super(message);

    console.error({ statusCode, type, message, error });
    console.error(this.stack);

    this.statusCode = statusCode;
    this.type = type;
    this.message = message;
    this.error = error;
  }
}
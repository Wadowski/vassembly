import { CommonError as ICommonError } from './types';
import { ErrorTypes } from './errorTypes';

export class CommonError extends Error implements ICommonError {
  statusCode: number;
  type: ErrorTypes;
  error?: unknown;

  constructor(statusCode: number, type: ErrorTypes, message: string, error?: unknown) {
    super(message);

    console.error({ statusCode, type, message, error });
    console.error(this.stack);

    this.statusCode = statusCode;
    this.type = type;
    this.message = message;
    this.error = error;
  }
}
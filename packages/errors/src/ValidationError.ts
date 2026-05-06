import { CommonError } from "./Error";
import { ErrorTypes } from "./errorTypes";

export class ValidationError extends CommonError {
  constructor(message: string, error?: unknown) {
    super(422, ErrorTypes.VALIDATION, message, error);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

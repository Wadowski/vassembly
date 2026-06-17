import { CommonError } from './Error';
import { ErrorStatusCodes, ErrorTypes } from './errorTypes';

export class UserInputWaitingError extends CommonError {
  readonly code = 'USER_INPUT_WAITING';

  constructor(message = 'Task execution waiting for user input') {
    super(
      ErrorStatusCodes[ErrorTypes.USER_INPUT_WAITING],
      ErrorTypes.USER_INPUT_WAITING,
      message,
    );
  }
}

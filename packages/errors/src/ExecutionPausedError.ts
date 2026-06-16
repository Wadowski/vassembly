import { CommonError } from './Error';
import { ErrorStatusCodes, ErrorTypes } from './errorTypes';

export class ExecutionPausedError extends CommonError {
  readonly code = 'EXECUTION_PAUSED';

  constructor(message = 'Task execution paused') {
    super(ErrorStatusCodes[ErrorTypes.EXECUTION_PAUSED], ErrorTypes.EXECUTION_PAUSED, message);
  }
}

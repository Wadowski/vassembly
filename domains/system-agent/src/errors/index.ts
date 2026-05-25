import { CommonError, ErrorTypes, NotFoundError } from '@vassembly/errors';

export const SYSTEM_AGENT_ERROR_CODES = {
  NAME_CONFLICT: 'SYSTEM_AGENT_NAME_CONFLICT',
  NOT_FOUND: 'SYSTEM_AGENT_NOT_FOUND',
  CONNECTION_REQUIRED: 'SYSTEM_AGENT_CONNECTION_REQUIRED',
  CONNECTION_INVALID: 'SYSTEM_AGENT_CONNECTION_INVALID',
} as const;

export type SystemAgentErrorCode =
  (typeof SYSTEM_AGENT_ERROR_CODES)[keyof typeof SYSTEM_AGENT_ERROR_CODES];

export const throwSystemAgentNameConflictError = (): never => {
  throw new CommonError(
    409,
    ErrorTypes.VALIDATION,
    'A platform agent with this name already exists',
    { code: SYSTEM_AGENT_ERROR_CODES.NAME_CONFLICT },
  );
};

export const throwSystemAgentNotFoundError = (): never => {
  throw new NotFoundError('This platform agent is no longer available.', {
    code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
  });
};

export const throwSystemAgentConnectionRequiredError = (): never => {
  throw new CommonError(
    422,
    ErrorTypes.VALIDATION,
    'Add an AI connection before using platform agents.',
    { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_REQUIRED },
  );
};

export const throwSystemAgentConnectionInvalidError = (): never => {
  throw new CommonError(
    422,
    ErrorTypes.VALIDATION,
    "Your system agent connection isn't working. Update it in Settings or test the connection.",
    { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
  );
};

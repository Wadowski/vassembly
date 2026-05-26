import { CommonError, ForbiddenError, NotFoundError } from '@vassembly/errors';
import { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';

interface SystemAgentErrorMapping {
  status: number;
  body: {
    code: string;
    message: string;
  };
}

const CONNECTION_OVERRIDE_FORBIDDEN_CODE = 'CONNECTION_OVERRIDE_FORBIDDEN';

const getSystemAgentErrorCode = (error: unknown): string | undefined => {
  if (!(error instanceof CommonError)) {
    return undefined;
  }

  const nestedError = error.error;
  if (nestedError !== null && typeof nestedError === 'object' && 'code' in nestedError) {
    return String((nestedError as { code: string }).code);
  }

  return undefined;
};

export const handleSystemAgentError = (error: unknown): SystemAgentErrorMapping | null => {
  const code = getSystemAgentErrorCode(error);

  if (code === SYSTEM_AGENT_ERROR_CODES.NAME_CONFLICT && error instanceof CommonError) {
    return {
      status: 409,
      body: { code, message: error.message },
    };
  }

  if (code === SYSTEM_AGENT_ERROR_CODES.CONNECTION_REQUIRED && error instanceof CommonError) {
    return {
      status: 422,
      body: { code, message: error.message },
    };
  }

  if (code === SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID && error instanceof CommonError) {
    return {
      status: 422,
      body: { code, message: error.message },
    };
  }

  if (code === SYSTEM_AGENT_ERROR_CODES.NOT_FOUND && error instanceof NotFoundError) {
    return {
      status: 404,
      body: { code, message: error.message },
    };
  }

  if (code === CONNECTION_OVERRIDE_FORBIDDEN_CODE && error instanceof ForbiddenError) {
    return {
      status: 403,
      body: { code, message: error.message },
    };
  }

  if (error instanceof CommonError) {
    return {
      status: error.statusCode,
      body: {
        code: code ?? error.type,
        message: error.message,
      },
    };
  }

  return null;
};

const SYSTEM_AGENT_ERROR_MESSAGES: Record<string, string> = {
  SYSTEM_AGENT_CONNECTION_REQUIRED: 'Add an AI connection before using platform agents.',
  SYSTEM_AGENT_CONNECTION_INVALID:
    "Your system agent connection isn't working. Update it in Settings or test the connection.",
  SYSTEM_AGENT_NOT_FOUND: 'This platform agent is no longer available.',
  SYSTEM_AGENT_NAME_CONFLICT: 'An agent with this name already exists.',
  VALIDATION_ERROR: 'Please fix the highlighted fields.',
};

export const getSystemAgentErrorMessage = (error: unknown, fallback: string): string => {
  if (error === null || error === undefined || typeof error !== 'object') {
    return fallback;
  }
  const record = error as { message?: string; error?: { code?: string } };
  const code = record.error?.code;
  if (code !== undefined && SYSTEM_AGENT_ERROR_MESSAGES[code] !== undefined) {
    return SYSTEM_AGENT_ERROR_MESSAGES[code];
  }
  if (typeof record.message === 'string' && record.message.trim() !== '') {
    return record.message;
  }
  return fallback;
};

export const isSystemAgentNameConflictError = (error: unknown): boolean => {
  if (error === null || error === undefined || typeof error !== 'object') {
    return false;
  }
  const record = error as { error?: { code?: string } };
  return record.error?.code === 'SYSTEM_AGENT_NAME_CONFLICT';
};

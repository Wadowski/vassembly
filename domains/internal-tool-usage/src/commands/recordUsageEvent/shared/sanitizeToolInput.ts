import { MAX_INPUT_FIELD_LENGTH } from '../../../constants';

const REDACTED_VALUE = '[REDACTED]';

const TRUNCATED_SUFFIX = '…[truncated]';

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|apikey|api_key|credential|authorization|access_key|private_key/i;

export interface SanitizeToolInputResult {
  value: Record<string, unknown> | null;
  inputTruncated: boolean;
}

const sanitizeStringValue = ({
  value,
}: {
  value: string;
}): { value: string; truncated: boolean } => {
  if (value.length <= MAX_INPUT_FIELD_LENGTH) {
    return { value, truncated: false };
  }

  return {
    value: `${value.slice(0, MAX_INPUT_FIELD_LENGTH)}${TRUNCATED_SUFFIX}`,
    truncated: true,
  };
};

const sanitizeValue = ({
  value,
}: {
  value: unknown;
}): { value: unknown; truncated: boolean } => {
  if (typeof value === 'string') {
    return sanitizeStringValue({ value });
  }

  if (value === null || value === undefined) {
    return { value, truncated: false };
  }

  if (typeof value === 'object') {
    const serialized = JSON.stringify(value);

    if (serialized.length <= MAX_INPUT_FIELD_LENGTH) {
      return { value, truncated: false };
    }

    return sanitizeStringValue({ value: serialized });
  }

  return { value, truncated: false };
};

const shouldRedactKey = (key: string): boolean => SENSITIVE_KEY_PATTERN.test(key);

export const sanitizeToolInput = (
  input: Record<string, unknown> | undefined,
): SanitizeToolInputResult => {
  if (input === undefined || Object.keys(input).length === 0) {
    return { value: null, inputTruncated: false };
  }

  let inputTruncated = false;
  const sanitized: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(input)) {
    if (shouldRedactKey(key)) {
      sanitized[key] = REDACTED_VALUE;
      continue;
    }

    const { value, truncated } = sanitizeValue({ value: rawValue });
    sanitized[key] = value;

    if (truncated) {
      inputTruncated = true;
    }
  }

  return { value: sanitized, inputTruncated };
};

export const sanitizeErrorMessage = (message: string | undefined): string | null => {
  if (message === undefined || message.trim().length === 0) {
    return null;
  }

  const { value, truncated } = sanitizeStringValue({ value: message.trim() });

  return truncated ? value : value;
};

export const sanitizeToolOutput = (
  output: string | undefined,
): { value: string | null; outputTruncated: boolean } => {
  if (output === undefined || output.trim().length === 0) {
    return { value: null, outputTruncated: false };
  }

  const { value, truncated } = sanitizeStringValue({ value: output });

  return { value, outputTruncated: truncated };
};

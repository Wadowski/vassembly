import { tryParseJson, repairLlmJson } from '@vassembly/validation';

export const normalizeMcpToolInput = ({ raw }: { raw: unknown }): unknown => {
  if (typeof raw !== 'string') {
    return raw;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return raw;
  }

  const direct = tryParseJson({ raw: trimmed });

  if (direct !== null) {
    return direct;
  }

  const repaired = repairLlmJson({ raw: trimmed });
  const repairedParsed = tryParseJson({ raw: repaired });

  return repairedParsed ?? raw;
};

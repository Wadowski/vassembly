import { repairLlmJson } from './repairLlmJson';
import { tryParseJson } from './tryParseJson';

const parseJsonObject = ({ raw }: { raw: string }): Record<string, unknown> | null => {
  const repaired = repairLlmJson({ raw });
  const candidates = [raw, repaired];

  for (const candidate of candidates) {
    const parsed = tryParseJson({ raw: candidate });

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  return null;
};

export const coerceStringifiedJson = ({ raw }: { raw: unknown }): unknown => {
  if (typeof raw !== 'string') {
    return raw;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {};
  }

  const parsed = parseJsonObject({ raw: trimmed });

  return parsed ?? {};
};

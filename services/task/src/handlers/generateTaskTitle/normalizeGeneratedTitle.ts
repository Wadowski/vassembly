export type NormalizeGeneratedTitleResult =
  | { isValid: true; title: string }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedTitleParams {
  rawOutput: string;
}

const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?]+$/;

const stripSurroundingQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

export const normalizeGeneratedTitle = ({
  rawOutput,
}: NormalizeGeneratedTitleParams): NormalizeGeneratedTitleResult => {
  let normalized = rawOutput.trim();
  normalized = normalized.split('\n')[0]!.trim();
  normalized = stripSurroundingQuotes(normalized);

  while (TRAILING_PUNCTUATION_PATTERN.test(normalized)) {
    normalized = normalized.replace(TRAILING_PUNCTUATION_PATTERN, '');
  }

  normalized = normalized.trim();

  if (normalized === '') {
    return { isValid: false, reason: 'empty_output' };
  }

  const words = normalized.split(/\s+/).filter((word) => word !== '');

  if (words.length > 8) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return { isValid: true, title: normalized };
};

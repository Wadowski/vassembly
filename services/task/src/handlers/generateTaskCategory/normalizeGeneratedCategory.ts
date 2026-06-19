import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

export type NormalizeGeneratedCategoryResult =
  | { isValid: true; category: INTENT_CATEGORY_SLUG }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedCategoryParams {
  rawOutput: string;
}

export const normalizeGeneratedCategory = ({
  rawOutput,
}: NormalizeGeneratedCategoryParams): NormalizeGeneratedCategoryResult => {
  const normalized = rawOutput.trim().split('\n')[0]!.trim().toLowerCase();

  if (normalized === '') {
    return { isValid: false, reason: 'empty_output' };
  }

  if (!VALID_SLUGS.has(normalized)) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return { isValid: true, category: normalized as INTENT_CATEGORY_SLUG };
};

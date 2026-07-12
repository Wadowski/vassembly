import { INTENT_CATEGORY_SLUG, normalizeIntentCategorySlug } from '@vassembly/constants';

export type NormalizeGeneratedCategoryResult =
  | { isValid: true; category: INTENT_CATEGORY_SLUG }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' };

export interface NormalizeGeneratedCategoryParams {
  rawOutput: string;
}

export const normalizeGeneratedCategory = ({
  rawOutput,
}: NormalizeGeneratedCategoryParams): NormalizeGeneratedCategoryResult => {
  const firstLine = rawOutput.trim().split('\n')[0]!.trim();

  if (firstLine === '') {
    return { isValid: false, reason: 'empty_output' };
  }

  const category = normalizeIntentCategorySlug(firstLine);

  if (category === null) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return { isValid: true, category };
};

import { INTENT_CATEGORY_SLUG } from './types';

const VALID_SLUGS = new Set<string>(Object.values(INTENT_CATEGORY_SLUG));

const LEGACY_SLUGS_MAPPED_TO_TASK = new Set(['question', 'scheduled_task', 'routine_task']);

const normalizeSlugToken = (raw: string): string => {
  const firstLine = raw.trim().split('\n')[0]!.trim().toLowerCase();

  return firstLine
    .replace(/[`"'*]/g, '')
    .replace(/[^a-z0-9_\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const isTaskCategoryOnlyMode = (): boolean =>
  VALID_SLUGS.size === 1 && VALID_SLUGS.has(INTENT_CATEGORY_SLUG.Task);

export const normalizeIntentCategorySlug = (raw: string): INTENT_CATEGORY_SLUG | null => {
  const normalized = normalizeSlugToken(raw);

  if (normalized === '') {
    return null;
  }

  if (VALID_SLUGS.has(normalized)) {
    return normalized as INTENT_CATEGORY_SLUG;
  }

  if (LEGACY_SLUGS_MAPPED_TO_TASK.has(normalized)) {
    return INTENT_CATEGORY_SLUG.Task;
  }

  if (isTaskCategoryOnlyMode()) {
    return INTENT_CATEGORY_SLUG.Task;
  }

  return null;
};

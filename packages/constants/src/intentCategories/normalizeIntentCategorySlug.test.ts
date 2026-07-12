import { describe, expect, it } from 'vitest';

import { normalizeIntentCategorySlug } from './normalizeIntentCategorySlug';
import { INTENT_CATEGORY_SLUG } from './types';

describe('normalizeIntentCategorySlug', () => {
  it('should return task for the active task slug', () => {
    expect(normalizeIntentCategorySlug('task')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug(' Task ')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('`task`')).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should map temporarily disabled legacy slugs to task', () => {
    expect(normalizeIntentCategorySlug('question')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('scheduled_task')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('routine_task')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('scheduled task')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('Routine Task')).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should coerce unrecognized non-empty values to task in task-category-only mode', () => {
    expect(normalizeIntentCategorySlug('action')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('one-off task')).toBe(INTENT_CATEGORY_SLUG.Task);
    expect(normalizeIntentCategorySlug('intent: question')).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should return null for empty or unknown slugs', () => {
    expect(normalizeIntentCategorySlug('')).toBeNull();
    expect(normalizeIntentCategorySlug('   ')).toBeNull();
  });
});

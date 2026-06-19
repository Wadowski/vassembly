import { describe, expect, it } from 'vitest';

import { SYSTEM_AGENT_NAME } from '../SystemAgentName';

import {
  getIntentCategoryBySlug,
  getIntentCategorySlugs,
  INTENT_CATEGORIES,
} from './registry';
import { INTENT_CATEGORY_SLUG } from './types';

describe('INTENT_CATEGORIES registry', () => {
  it('should expose all v1 category slugs', () => {
    expect(getIntentCategorySlugs()).toEqual([
      INTENT_CATEGORY_SLUG.Question,
      INTENT_CATEGORY_SLUG.Task,
      INTENT_CATEGORY_SLUG.ScheduledTask,
      INTENT_CATEGORY_SLUG.RoutineTask,
    ]);
  });

  it('should resolve category by slug', () => {
    const category = getIntentCategoryBySlug(INTENT_CATEGORY_SLUG.Task);

    expect(category?.label).toBe('Task');
    expect(category?.targetSystemAgentName).toBe(SYSTEM_AGENT_NAME.TaskWorker);
  });

  it('should map each category to a distinct worker agent', () => {
    const targets = INTENT_CATEGORIES.map((category) => category.targetSystemAgentName);
    expect(new Set(targets).size).toBe(targets.length);
  });
});

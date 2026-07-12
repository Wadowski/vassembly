import { SYSTEM_AGENT_NAME } from '../SystemAgentName';

import { INTENT_CATEGORY_SLUG } from './types';

import type { IntentCategoryDefinition } from './types';

export const INTENT_CATEGORIES: IntentCategoryDefinition[] = [
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.Question,
  //   label: 'Question',
  //   description:
  //     'The user seeks information, an explanation, or a factual answer. They expect a direct response, not execution of work.',
  //   examples: ['What is…?', 'How does… work?', 'Explain…'],
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.QuestionWorker,
  // },
  {
    slug: INTENT_CATEGORY_SLUG.Task,
    label: 'Task',
    description:
      'The user wants a one-off action performed now or as a single piece of work. Includes create, update, send, fix, or accomplish requests without explicit future scheduling or repetition.',
    examples: ['Send an email to…', 'Fix the bug in…', 'Create a document…'],
    targetSystemAgentName: SYSTEM_AGENT_NAME.TaskWorker,
  },
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.ScheduledTask,
  //   label: 'Scheduled task',
  //   description:
  //     'The user wants work done at a specific future time or on a one-time schedule. Mentions dates, times, reminders, or deferral.',
  //   examples: ['Remind me tomorrow at 9am…', 'Run this on Friday…', 'Schedule for next week…'],
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.ScheduledTaskWorker,
  // },
  // { // TEMPORARILY DISABLED — task-category-only-mode
  //   slug: INTENT_CATEGORY_SLUG.RoutineTask,
  //   label: 'Routine task',
  //   description: 'The user wants recurring or habitual work on a repeating pattern.',
  //   examples: ['Every Monday…', 'Daily standup summary…', 'Each time I receive…'],
  //   targetSystemAgentName: SYSTEM_AGENT_NAME.RoutineTaskWorker,
  // },
];

const intentCategoryBySlug = new Map(INTENT_CATEGORIES.map((category) => [category.slug, category]));

export const getIntentCategorySlugs = (): string[] => INTENT_CATEGORIES.map((category) => category.slug);

export const getIntentCategoryBySlug = (slug: string): IntentCategoryDefinition | undefined =>
  intentCategoryBySlug.get(slug as INTENT_CATEGORY_SLUG);

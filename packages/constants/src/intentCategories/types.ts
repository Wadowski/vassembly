export enum INTENT_CATEGORY_SLUG {
  // Question = 'question', // TEMPORARILY DISABLED — task-category-only-mode
  Task = 'task',
  // ScheduledTask = 'scheduled_task', // TEMPORARILY DISABLED — task-category-only-mode
  // RoutineTask = 'routine_task', // TEMPORARILY DISABLED — task-category-only-mode
}

export interface IntentCategoryDefinition {
  slug: INTENT_CATEGORY_SLUG;
  label: string;
  description: string;
  examples: string[];
  targetSystemAgentName: string;
}

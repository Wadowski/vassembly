export enum INTENT_CATEGORY_SLUG {
  Question = 'question',
  Task = 'task',
  ScheduledTask = 'scheduled_task',
  RoutineTask = 'routine_task',
}

export interface IntentCategoryDefinition {
  slug: INTENT_CATEGORY_SLUG;
  label: string;
  description: string;
  examples: string[];
  targetSystemAgentName: string;
}

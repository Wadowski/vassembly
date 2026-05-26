const TASK_DRAFT_KEY = 'task:draftDescription';

export const taskSessionStorage = {
  save: (description: string): void => {
    sessionStorage.setItem(TASK_DRAFT_KEY, description);
  },
  load: (): string | null => {
    return sessionStorage.getItem(TASK_DRAFT_KEY);
  },
  clear: (): void => {
    sessionStorage.removeItem(TASK_DRAFT_KEY);
  },
};

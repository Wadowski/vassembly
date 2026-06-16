const controllers = new Map<string, AbortController>();

export const executionRegistry = {
  register: ({ taskId }: { taskId: string }): AbortSignal => {
    const existing = controllers.get(taskId);

    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    controllers.set(taskId, controller);
    return controller.signal;
  },

  abort: ({ taskId }: { taskId: string }): boolean => {
    const controller = controllers.get(taskId);

    if (!controller) {
      return false;
    }

    controller.abort();
    controllers.delete(taskId);
    return true;
  },

  deregister: ({ taskId }: { taskId: string }): void => {
    controllers.delete(taskId);
  },

  getSignal: ({ taskId }: { taskId: string }): AbortSignal | undefined => {
    return controllers.get(taskId)?.signal;
  },
};

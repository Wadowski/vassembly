import type { BddWorld } from '../../fixtures/types';

export interface ResolveWorldPathParams {
  path: string;
  world: BddWorld;
}

export const resolveWorldPath = ({ path, world }: ResolveWorldPathParams): string => {
  let resolved = path;

  if (resolved.includes('{agentId}')) {
    if (!world.agentId) {
      throw new Error('agentId is required but not set on world.');
    }
    resolved = resolved.replace(/{agentId}/g, world.agentId);
  }

  if (resolved.includes('{taskId}')) {
    const taskId = world.taskId ?? world.storedFields?.taskId;
    if (!taskId) {
      throw new Error('taskId is required but not set on world.');
    }
    resolved = resolved.replace(/{taskId}/g, taskId);
  }

  return resolved;
};

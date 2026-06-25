import type { WebBddWorld } from './types';

export interface ResolveWorldPathParams {
  path: string;
  world: WebBddWorld;
}

export const resolveWorldPath = ({ path, world }: ResolveWorldPathParams): string => {
  let resolved = path;

  if (resolved.includes('{agentId}')) {
    if (!world.agentId) {
      throw new Error('agentId is required but not set on world.');
    }
    resolved = resolved.replace(/{agentId}/g, world.agentId);
  }

  if (resolved.includes('{systemAgentId}')) {
    if (!world.systemAgentId) {
      throw new Error('systemAgentId is required but not set on world.');
    }
    resolved = resolved.replace(/{systemAgentId}/g, world.systemAgentId);
  }

  if (resolved.includes('{taskId}')) {
    const taskId = world.taskId ?? world.storedFields?.taskId;
    if (!taskId) {
      throw new Error('taskId is required but not set on world.');
    }
    resolved = resolved.replace(/{taskId}/g, taskId);
  }

  if (resolved.includes('{specializationId}')) {
    if (!world.specializationId) {
      throw new Error('specializationId is required but not set on world.');
    }
    resolved = resolved.replace(/{specializationId}/g, world.specializationId);
  }

  if (resolved.includes('{skillId}')) {
    if (!world.skillId) {
      throw new Error('skillId is required but not set on world.');
    }
    resolved = resolved.replace(/{skillId}/g, world.skillId);
  }

  return resolved;
};

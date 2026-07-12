import type { SandboxBackendStrategy, WorkspaceHandle } from './types';

export interface WorkspaceManagerParams {
  strategy: SandboxBackendStrategy;
}

export interface GetOrCreateWorkspaceParams {
  workspaceId: string;
}

export interface DestroyWorkspaceParams {
  workspaceId: string;
}

export interface WorkspaceManager {
  getOrCreateWorkspace: (params: GetOrCreateWorkspaceParams) => Promise<WorkspaceHandle>;
  destroyWorkspace: (params: DestroyWorkspaceParams) => Promise<void>;
}

export const WorkspaceManager = ({ strategy }: WorkspaceManagerParams): WorkspaceManager => {
  const activeWorkspaces = new Set<string>();

  return {
    getOrCreateWorkspace: async ({ workspaceId }) => {
      activeWorkspaces.add(workspaceId);
      return { workspaceId };
    },

    destroyWorkspace: async ({ workspaceId }) => {
      if (!activeWorkspaces.has(workspaceId)) {
        return;
      }

      activeWorkspaces.delete(workspaceId);
      await strategy.deleteWorkspace({ workspaceId });
    },
  };
};

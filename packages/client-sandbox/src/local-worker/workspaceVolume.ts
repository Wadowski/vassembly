import { join } from 'node:path';

import { promises as fs } from 'node:fs';

const WORKSPACE_ROOT = '.data/sandbox-workspaces';

export interface WorkspaceIdParams {
  workspaceId: string;
}

export const getWorkspacePath = ({ workspaceId }: WorkspaceIdParams): string =>
  join(WORKSPACE_ROOT, workspaceId);

export const ensureWorkspace = async ({ workspaceId }: WorkspaceIdParams): Promise<string> => {
  const workspacePath = getWorkspacePath({ workspaceId });
  await fs.mkdir(workspacePath, { recursive: true });
  return workspacePath;
};

export const removeWorkspace = async ({ workspaceId }: WorkspaceIdParams): Promise<void> => {
  const workspacePath = getWorkspacePath({ workspaceId });
  await fs.rm(workspacePath, { recursive: true, force: true });
};

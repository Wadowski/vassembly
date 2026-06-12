import { createRequire } from 'node:module';
import path from 'node:path';

const packageRoot = path.resolve(__dirname, '../..');
const workspaceRequire = createRequire(path.join(packageRoot, 'package.json'));

export interface RequireWorkspaceModuleParams {
  moduleName: string;
}

export const requireWorkspaceModule = <T>({
  moduleName,
}: RequireWorkspaceModuleParams): T =>
  workspaceRequire(workspaceRequire.resolve(moduleName)) as T;

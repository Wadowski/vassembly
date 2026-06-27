import {
  LocalScriptStorageStrategy,
  S3ScriptStorageStrategy,
} from '@vassembly/client-script-storage';
import { config, Environment } from '@vassembly/config';

import type { ScriptStorageStrategy } from '@vassembly/client-script-storage';

export type ScriptStorageClient = ScriptStorageStrategy;

export const createScriptStorageClient = (): ScriptStorageClient => {
  if (config.environment !== Environment.Production) {
    const rootPath = config.skills.scriptStorage.localRootPath ?? './.data/skill-scripts';

    return LocalScriptStorageStrategy({ rootPath });
  }

  const { bucketName } = config.skills.scriptStorage;

  if (bucketName === '') {
    throw new Error('SKILL_SCRIPT_STORAGE_BUCKET is required in production');
  }

  return S3ScriptStorageStrategy({ bucketName });
};

export const scriptStorageClient = createScriptStorageClient();

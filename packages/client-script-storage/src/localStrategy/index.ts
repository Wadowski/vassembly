import path from 'node:path';

import { DirectoryClient, FileClient } from '@vassembly/client-file';

import type { ScriptStorageStrategy } from '../types';

import type { LocalStrategyParams } from './types';

export const LocalScriptStorageStrategy = ({
  rootPath,
}: LocalStrategyParams): ScriptStorageStrategy => {
  const dir = DirectoryClient({ basePath: rootPath });
  const file = FileClient({ basePath: rootPath });

  return {
    getScriptContent: async ({ storageKey }) => file.read({ filePath: storageKey }),

    putScriptContent: async ({ storageKey, content }) => {
      const parentDir = path.dirname(storageKey);

      if (parentDir !== '.') {
        await dir.create({ dirPath: parentDir });
      }

      await file.write({ filePath: storageKey, content });
    },

    removeScriptContent: async ({ storageKey }) =>
      file.removeIfExists({ filePath: storageKey }),
  };
};

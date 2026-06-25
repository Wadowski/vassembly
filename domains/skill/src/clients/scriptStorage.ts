import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { AwsS3Client } from '@vassembly/client-aws-s3';
import { config, Environment } from '@vassembly/config';

export interface GetScriptContentParams {
  storageKey: string;
}

export interface ScriptStorageClient {
  getScriptContent: (params: GetScriptContentParams) => Promise<string>;
}

export const createScriptStorageClient = (): ScriptStorageClient => {
  const isLocal = config.environment !== Environment.Production;

  if (isLocal) {
    const localRootPath = config.skills.scriptStorage.localRootPath ?? './.data/skill-scripts';

    return {
      getScriptContent: async ({ storageKey }: GetScriptContentParams): Promise<string> => {
        const fullPath = path.join(localRootPath, storageKey);
        return readFile(fullPath, 'utf-8');
      },
    };
  }

  const bucketName = config.skills.scriptStorage.bucketName;

  if (bucketName === '') {
    throw new Error('SKILL_SCRIPT_STORAGE_BUCKET is required in production');
  }

  const s3 = AwsS3Client({ bucketName });

  return {
    getScriptContent: async ({ storageKey }: GetScriptContentParams): Promise<string> => {
      const content = await s3.getFile({ key: storageKey });

      if (content === undefined) {
        throw new Error('script_file_missing');
      }

      return content;
    },
  };
};

export const scriptStorageClient = createScriptStorageClient();

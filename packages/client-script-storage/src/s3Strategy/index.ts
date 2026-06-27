import { AwsS3Client } from '@vassembly/client-aws-s3';
import { NotFoundError } from '@vassembly/errors';

import type { ScriptStorageStrategy } from '../types';

import type { S3StrategyParams } from './types';

export const S3ScriptStorageStrategy = ({
  bucketName,
}: S3StrategyParams): ScriptStorageStrategy => {
  const s3 = AwsS3Client({ bucketName });

  return {
    getScriptContent: async ({ storageKey }) => {
      const content = await s3.getFile({ key: storageKey });

      if (content === undefined) {
        throw new NotFoundError('script_file_missing');
      }

      return content;
    },

    putScriptContent: async ({ storageKey, content }) => {
      await s3.uploadFile({
        key: storageKey,
        file: Buffer.from(content, 'utf-8'),
        fileType: 'text/plain',
      });
    },

    removeScriptContent: async ({ storageKey }) => {
      await s3.removeFile({ key: storageKey });
    },
  };
};

import { InternalError, NotFoundError } from '@vassembly/errors';

import { scriptStorageClient } from '../../clients';
import { getModelById } from '../getModelById';

import type { GetScriptContentParams, GetScriptContentResult } from './types';

export type { GetScriptContentParams, GetScriptContentResult } from './types';

export const getScriptContent = async ({
  skillId,
  filename,
}: GetScriptContentParams): Promise<GetScriptContentResult> => {
  let skill;

  try {
    const result = await getModelById({ id: skillId });
    skill = result.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError('skill_not_found');
    }

    throw error;
  }

  const script = skill.scripts.find((entry) => entry.filename === filename);

  if (script === undefined) {
    throw new NotFoundError('script_not_found');
  }

  try {
    const content = await scriptStorageClient.getScriptContent({
      storageKey: script.storageKey,
    });

    return { content };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError('script_file_missing');
    }

    throw new InternalError('storage_error', error);
  }
};

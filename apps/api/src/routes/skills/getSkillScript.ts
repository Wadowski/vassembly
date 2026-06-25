import { InternalError, NotFoundError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import skillDomain, { scriptStorageClient } from '@vassembly/domain-skill';

const isEnoentError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: string }).code === 'ENOENT';
};

export const skillGetScriptRoute = defineRoute({
  method: 'GET',
  url: '/:skillId/scripts/:filename',
  handler: async ({ headers, params }) => {
    await authHandlers.authorizeAdminRequest({ headers });

    const skillId = params?.skillId;
    const encodedFilename = params?.filename;

    if (skillId === undefined || skillId === '' || encodedFilename === undefined || encodedFilename === '') {
      throw new NotFoundError('skill_not_found');
    }

    const filename = decodeURIComponent(encodedFilename);

    let skillModel;
    try {
      const result = await skillDomain.queries.getModelById({ id: skillId });
      skillModel = result.data;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('skill_not_found');
      }

      throw error;
    }

    const script = skillModel.scripts.find((entry) => entry.filename === filename);

    if (script === undefined) {
      throw new NotFoundError('script_not_found');
    }

    try {
      return await scriptStorageClient.getScriptContent({ storageKey: script.storageKey });
    } catch (error) {
      if (isEnoentError(error)) {
        throw new NotFoundError('script_file_missing');
      }

      throw new InternalError('storage_error', error);
    }
  },
});

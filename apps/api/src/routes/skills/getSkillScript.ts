import { NotFoundError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import skillService from '@vassembly/service-skill';

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
    const { content } = await skillService.getSkillScript({ skillId, filename });

    return content;
  },
});

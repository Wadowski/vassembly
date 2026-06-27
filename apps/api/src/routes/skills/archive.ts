import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import skillService from '@vassembly/service-skill';
import { withErrorResponses } from '../errorSchema';

import { SKILL_RESPONSE_SCHEMA } from './schemas';

export const skillArchiveRoute = defineRoute({
  method: 'DELETE',
  url: '/:id',
  schema: {
    response: withErrorResponses(SKILL_RESPONSE_SCHEMA),
  },
  handler: async ({ headers, params }) => {
    const skillId = params?.id;

    if (skillId === undefined || skillId === '') {
      throw new WrongParamError('Missing skill id');
    }

    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { skill } = await skillService.archiveSkill({
      adminUserId: userId,
      skillId,
    });

    return skill;
  },
});

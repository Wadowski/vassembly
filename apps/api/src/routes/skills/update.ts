import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import skillService from '@vassembly/service-skill';
import { withErrorResponses } from '../errorSchema';

import { SKILL_RESPONSE_SCHEMA, UPDATE_SKILL_BODY_SCHEMA } from './schemas';

export const skillUpdateRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: {
    body: UPDATE_SKILL_BODY_SCHEMA,
    response: withErrorResponses(SKILL_RESPONSE_SCHEMA),
  },
  handler: async ({ body, headers, params }) => {
    const skillId = params?.id;

    if (skillId === undefined || skillId === '') {
      throw new WrongParamError('Missing skill id');
    }

    await authHandlers.authorizeAdminRequest({ headers });

    const { skill } = await skillService.updateSkill({
      skillId,
      description: body.description,
      rule: body.rule,
      enabled: body.enabled,
      scripts: body.scripts,
    });

    return skill;
  },
});

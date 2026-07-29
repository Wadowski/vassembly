import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import skillService from '@vassembly/service-skill';
import { withErrorResponses } from '../errorSchema';

import { CREATE_SKILL_BODY_SCHEMA, SKILL_RESPONSE_SCHEMA } from './schemas';

export const skillCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    body: CREATE_SKILL_BODY_SCHEMA,
    response: withErrorResponses(SKILL_RESPONSE_SCHEMA, 201),
  },
  handler: async ({ body, headers }) => {
    await authHandlers.authorizeAdminRequest({ headers });

    const { skill } = await skillService.createSkill({
      specializationId: body.specializationId,
      name: body.name,
      description: body.description,
      input: body.input,
      output: body.output,
      rule: body.rule,
      scripts: body.scripts,
      usesSkillIds: body.usesSkillIds,
    });

    return skill;
  },
});

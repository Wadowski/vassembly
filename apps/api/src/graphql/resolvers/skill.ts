import { applyResolvers } from '@vassembly/graphql';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { gqlSchema as gqlSkillSchema } from '@vassembly/domain-skill';
import { NotFoundError, UnauthorizedError, WrongParamError } from '@vassembly/errors';
import skillService from '@vassembly/service-skill';
import userDomain from '@vassembly/domain-user';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import type { ApiGraphQLContext } from '../shared/types';

interface SkillResolverArgs {
  id: string;
}

interface SkillsBySpecializationResolverArgs {
  specializationId: string;
  page?: number | null;
  size?: number | null;
  search?: string | null;
}

export const registerSkillResolvers = (builder: Builder): void => {
  gqlSkillSchema(builder);

  applyResolvers({
    builder,
    queries: (t) => ({
      skill: t.field({
        type: 'Skill',
        nullable: true,
        args: { id: t.arg.string({ required: true }) },
        resolve: async (_root: unknown, args: SkillResolverArgs, context: ApiGraphQLContext) => {
          enforceOnboardingCompleteForQuery({ queryName: 'skill', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          await userDomain.queries.assertHasRole({
            userId,
            role: AUTH_TOKEN_ROLE.ADMIN,
          });

          try {
            const result = await skillService.getSkill({ id: args.id });
            return result.skill;
          } catch (error) {
            if (error instanceof NotFoundError || error instanceof WrongParamError) {
              return null;
            }

            throw error;
          }
        },
      }),

      skillsBySpecialization: t.field({
        type: 'SkillPage',
        args: {
          specializationId: t.arg.string({ required: true }),
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: SkillsBySpecializationResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'skillsBySpecialization', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          await userDomain.queries.assertHasRole({
            userId,
            role: AUTH_TOKEN_ROLE.ADMIN,
          });

          const result = await skillService.listSkillsBySpecialization({
            specializationId: args.specializationId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
          });

          return {
            items: result.items,
            total: result.total,
            page: result.page,
            size: result.size,
          };
        },
      }),
    }),
  });
};

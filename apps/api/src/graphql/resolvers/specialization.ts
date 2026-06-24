import { applyResolvers } from '@vassembly/graphql';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { gqlSchema as gqlSpecializationSchema } from '@vassembly/domain-specialization';
import { UnauthorizedError } from '@vassembly/errors';
import specializationService from '@vassembly/service-specialization';
import userDomain from '@vassembly/domain-user';
import type { Builder } from '@vassembly/graphql';

interface SpecializationsResolverArgs {
  search?: string | null;
  page?: number | null;
  size?: number | null;
}

interface SpecializationResolverArgs {
  id: string;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

export const registerSpecializationResolvers = (builder: Builder): void => {
  gqlSpecializationSchema(builder);

  applyResolvers({
    builder,
    queries: (t) => ({
      specializations: t.field({
        type: 'SpecializationPage',
        args: {
          search: t.arg.string({ required: false }),
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 20 }),
        },
        resolve: async (
          _root: unknown,
          args: SpecializationsResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          await userDomain.queries.assertHasRole({
            userId,
            role: AUTH_TOKEN_ROLE.ADMIN,
          });

          return specializationService.listSpecializations({
            page: args.page ?? 0,
            size: args.size ?? 20,
            search: args.search ?? undefined,
          });
        },
      }),

      specialization: t.field({
        type: 'Specialization',
        nullable: true,
        args: { id: t.arg.string({ required: true }) },
        resolve: async (
          _root: unknown,
          args: SpecializationResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          await userDomain.queries.assertHasRole({
            userId,
            role: AUTH_TOKEN_ROLE.ADMIN,
          });

          const result = await specializationService.getSpecialization({ id: args.id });
          return result.specialization;
        },
      }),
    }),
  });
};

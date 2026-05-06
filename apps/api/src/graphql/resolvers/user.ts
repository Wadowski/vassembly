import { applyResolvers } from '@vassembly/graphql';
import { handlers } from '@vassembly/service-auth';
import type { Builder } from '@vassembly/graphql';

export const registerUserResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      user: t.field({
        type: 'User',
        args: { id: t.arg.id({ required: true }) },
        resolve: async (_root: unknown, args: { id: string }) => {
          const result = await handlers.getUser({ id: args.id });
          return result.user;
        },
      }),
    }),
  });
};

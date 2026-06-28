import { getAllInternalTools, InternalToolAccessScope } from '@vassembly/constants';
import type { InternalToolDefinition } from '@vassembly/constants';
import { applyResolvers, defineObjectType, graphQLListType, graphQLType } from '@vassembly/graphql';
import { UnauthorizedError } from '@vassembly/errors';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import type { ApiGraphQLContext } from '../shared/types';

export const gqlInternalToolSchema = (builder: Builder): void => {
  builder.enumType(InternalToolAccessScope, {
    name: 'InternalToolAccessScope',
  });

  defineObjectType(builder, 'InternalTool', {
    fields: (t) => ({
      id: t.exposeID('id'),
      displayName: t.exposeString('displayName'),
      description: t.exposeString('description'),
      accessScope: t.field({
        type: graphQLType('InternalToolAccessScope'),
        resolve: (parent: InternalToolDefinition) => parent.accessScope,
      }),
    }),
  });
};

export const registerInternalToolResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      internalTools: t.field({
        type: graphQLListType('InternalTool'),
        resolve: async (_root: unknown, _args: unknown, context: ApiGraphQLContext) => {
          enforceOnboardingCompleteForQuery({ queryName: 'internalTools', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required to view internal tools');
          }

          return getAllInternalTools();
        },
      }),
    }),
  });
};

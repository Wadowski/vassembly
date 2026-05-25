import { applyResolvers } from '@vassembly/graphql';
import {
  AI_INTEGRATION_LIST_ALL_STATUSES,
  AiIntegrationProvider,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import type { AiIntegrationListStatusFilter } from '@vassembly/domain-ai-integration';
import { UnauthorizedError } from '@vassembly/errors';
import agentService from '@vassembly/service-agent';
import type { Builder } from '@vassembly/graphql';

interface AiIntegrationsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  status?: string | null;
  provider?: string | null;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

const resolveStatusFilter = (status?: string | null): AiIntegrationListStatusFilter | undefined => {
  if (status === AI_INTEGRATION_LIST_ALL_STATUSES) {
    return AI_INTEGRATION_LIST_ALL_STATUSES;
  }
  if (status && (Object.values(AiIntegrationStatus) as string[]).includes(status)) {
    return status as AiIntegrationListStatusFilter;
  }
  return undefined;
};

const resolveProviderFilter = (
  provider?: string | null,
): (typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider] | undefined => {
  if (provider && (Object.values(AiIntegrationProvider) as string[]).includes(provider)) {
    return provider as (typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider];
  }
  return undefined;
};

export const registerAiIntegrationResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      aiIntegrations: t.field({
        type: 'AiIntegrationCredentialsList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
          status: t.arg.string({ required: false }),
          provider: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: AiIntegrationsListResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await agentService.listCredentials({
            userId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
            status: resolveStatusFilter(args.status),
            provider: resolveProviderFilter(args.provider),
          });

          return {
            items: result.items,
            totalCount: result.totalCount,
            page: result.page,
            size: result.size,
          };
        },
      }),
    }),
  });
};

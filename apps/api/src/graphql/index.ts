import { createBuilder, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfig } from '@vassembly/server';
import * as agentDomain from '@vassembly/domain-agent';
import * as aiIntegrationDomain from '@vassembly/domain-ai-integration';
import * as userDomain from '@vassembly/domain-user';

import { createApiGraphQLContext } from './context';
import { registerAgentResolvers } from './resolvers/agent';
import { registerAiIntegrationResolvers } from './resolvers/aiIntegration';
import { registerUserResolvers } from './resolvers/user';

const builder = createBuilder();

userDomain.gqlSchema(builder);
agentDomain.gqlSchema(builder);
aiIntegrationDomain.gqlSchema(builder);
registerUserResolvers(builder);
registerAgentResolvers(builder);
registerAiIntegrationResolvers(builder);

const { schema, path } = buildGraphQLConfig({
  builder,
  path: '/graphql',
});

export const graphqlConfig: GraphQLConfig<{ authenticatedUserId: string | undefined }> = {
  schema,
  path,
  context: createApiGraphQLContext,
};

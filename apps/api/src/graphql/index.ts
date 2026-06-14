import { createBuilder, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfig } from '@vassembly/server';
import * as agentDomain from '@vassembly/domain-agent';
import * as aiIntegrationDomain from '@vassembly/domain-ai-integration';
import * as taskDomain from '@vassembly/domain-task';
import * as userDomain from '@vassembly/domain-user';
import * as systemAgentDomain from '@vassembly/domain-system-agent';

import { createApiGraphQLContext } from './context';
import { registerAgentResolvers } from './resolvers/agent';
import { registerAiIntegrationResolvers } from './resolvers/aiIntegration';
import { registerTaskResolvers } from './resolvers/task';
import { registerUserResolvers } from './resolvers/user';
import { registerSystemAgentResolvers } from './resolvers/systemAgent';
import { registerMcpResolvers, gqlMcpSchema } from './resolvers/mcp';
import {
  gqlInternalToolSchema,
  registerInternalToolResolvers,
} from './resolvers/internalTool';

const builder = createBuilder();

userDomain.gqlSchema(builder);
agentDomain.gqlSchema(builder);
aiIntegrationDomain.gqlSchema(builder);
systemAgentDomain.gqlSchema(builder);
taskDomain.gqlSchema(builder);
gqlMcpSchema(builder);
gqlInternalToolSchema(builder);
registerUserResolvers(builder);
registerAgentResolvers(builder);
registerAiIntegrationResolvers(builder);
registerSystemAgentResolvers(builder);
registerTaskResolvers(builder);
registerMcpResolvers(builder);
registerInternalToolResolvers(builder);

const { schema, path } = buildGraphQLConfig({
  builder,
  path: '/graphql',
});

export const graphqlConfig: GraphQLConfig<{ authenticatedUserId: string | undefined }> = {
  schema,
  path,
  context: createApiGraphQLContext,
};

import { createBuilder, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfig } from '@vassembly/server';
import * as agentDomain from '@vassembly/domain-agent';
import * as aiIntegrationDomain from '@vassembly/domain-ai-integration';
import * as taskDomain from '@vassembly/domain-task';
import * as taskProgressDomain from '@vassembly/domain-task-progress';
import * as taskQuestionsDomain from '@vassembly/domain-task-questions';
import * as userDomain from '@vassembly/domain-user';
import * as systemAgentDomain from '@vassembly/domain-system-agent';

import { createApiGraphQLContext } from './context';
import type { ApiGraphQLContext } from './shared/types';
import { registerAgentResolvers } from './resolvers/agent';
import { registerAiIntegrationResolvers } from './resolvers/aiIntegration';
import { registerTaskResolvers } from './resolvers/task';
import { registerTaskProgressResolvers } from './resolvers/taskProgress';
import { registerTaskQuestionsResolvers } from './resolvers/taskQuestions';
import { registerUserResolvers } from './resolvers/user';
import { registerSystemAgentResolvers } from './resolvers/systemAgent';
import { registerMcpResolvers, gqlMcpSchema } from './resolvers/mcp';
import { registerSpecializationResolvers } from './resolvers/specialization';
import { registerSkillResolvers } from './resolvers/skill';
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
taskProgressDomain.gqlSchema(builder);
taskQuestionsDomain.gqlSchema(builder);
gqlMcpSchema(builder);
gqlInternalToolSchema(builder);
registerUserResolvers(builder);
registerAgentResolvers(builder);
registerAiIntegrationResolvers(builder);
registerSystemAgentResolvers(builder);
registerTaskResolvers(builder);
registerTaskProgressResolvers(builder);
registerTaskQuestionsResolvers(builder);
registerMcpResolvers(builder);
registerSpecializationResolvers(builder);
registerSkillResolvers(builder);
registerInternalToolResolvers(builder);

const { schema, path } = buildGraphQLConfig({
  builder,
  path: '/graphql',
});

export const graphqlConfig: GraphQLConfig<ApiGraphQLContext> = {
  schema,
  path,
  context: createApiGraphQLContext,
};

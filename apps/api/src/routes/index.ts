import { initCache } from "@vassembly/cache";
import { init as initMongoDb } from "@vassembly/client-mongodb";
import { initRedis } from "@vassembly/client-redis";
import { createServer, routesWithPrefix } from "@vassembly/server";
import { CacheBackend, config } from "@vassembly/config";
import { mongodbIndexes as agentMongodbIndexes } from "@vassembly/domain-agent";
import { mongodbIndexes as aiIntegrationMongodbIndexes } from "@vassembly/domain-ai-integration";
import { mongodbIndexes as systemAgentMongodbIndexes } from "@vassembly/domain-system-agent";
import { mongodbIndexes as taskMongodbIndexes } from "@vassembly/domain-task";
import { mongodbIndexes as userMongodbIndexes } from "@vassembly/domain-user";
import mcpDomain from "@vassembly/domain-mcp";

import { routes as agentRoutesList } from "./agents";
import { routes as aiIntegrationRoutesList } from "./ai-integrations";
import { routes as authRoutesList } from "./auth";
import { routes as systemAgentsRoutesList } from "./system-agents";
import { routes as taskRoutesList } from "./tasks";
import { routes as userRoutesList } from "./user";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/auth", authRoutesList);
const userRoutes = routesWithPrefix("/user", userRoutesList);
const agentRoutes = routesWithPrefix("/agents", agentRoutesList);
const aiIntegrationRoutes = routesWithPrefix("/ai-integrations", aiIntegrationRoutesList);
const systemAgentsRoutes = routesWithPrefix("/system-agents", systemAgentsRoutesList);
const taskRoutes = routesWithPrefix("/tasks", taskRoutesList);

const routes = [
  ...authRoutes,
  ...userRoutes,
  ...agentRoutes,
  ...aiIntegrationRoutes,
  ...systemAgentsRoutes,
  ...taskRoutes,
];

const startApp = async () => {
  if (config.cache.backend === CacheBackend.Redis) {
    await initRedis();
  }
  await initCache();

  await initMongoDb({
    indexFunctions: [
      userMongodbIndexes,
      agentMongodbIndexes,
      aiIntegrationMongodbIndexes,
      systemAgentMongodbIndexes,
      taskMongodbIndexes,
      mcpDomain.mongodbIndexes,
    ],
  });

  await mcpDomain.seedMcps();
  console.log("MCPs seeded successfully");

  const fastify = await createServer({
    routes,
    graphql: graphqlConfig,
    allowedOrigins: config.services.api.allowedOrigins,
  });

  fastify.listen(
    { port: config.services.api.port },
    (err: Error | null, address: string) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server is running on ${address}`);
    },
  );
};

startApp();

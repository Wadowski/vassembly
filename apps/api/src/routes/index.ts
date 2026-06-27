import { initCache } from "@vassembly/cache";
import { initRedis } from "@vassembly/client-redis";
import { createServer, routesWithPrefix } from "@vassembly/server";
import { CacheBackend, config } from "@vassembly/config";
import mcpDomain from "@vassembly/domain-mcp";
import systemAgentDomain from "@vassembly/domain-system-agent";

import { registerApiMongoIndexes } from "../bootstrap/mongoIndexes";
import { routes as agentRoutesList } from "./agents";
import { routes as aiIntegrationRoutesList } from "./ai-integrations";
import { routes as authRoutesList } from "./auth";
import { mcpConfigurationRoutes } from "./mcps";
import { routes as systemAgentsRoutesList } from "./system-agents";
import { routes as skillRoutesList } from "./skills";
import { routes as taskRoutesList } from "./tasks";
import { routes as userRoutesList } from "./user";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/auth", authRoutesList);
const userRoutes = routesWithPrefix("/user", userRoutesList);
const agentRoutes = routesWithPrefix("/agents", agentRoutesList);
const aiIntegrationRoutes = routesWithPrefix("/ai-integrations", aiIntegrationRoutesList);
const systemAgentsRoutes = routesWithPrefix("/system-agents", systemAgentsRoutesList);
const skillRoutes = routesWithPrefix("/skills", skillRoutesList);
const taskRoutes = routesWithPrefix("/tasks", taskRoutesList);
const mcpRoutes = routesWithPrefix("/mcps", mcpConfigurationRoutes);

const routes = [
  ...authRoutes,
  ...userRoutes,
  ...agentRoutes,
  ...aiIntegrationRoutes,
  ...systemAgentsRoutes,
  ...skillRoutes,
  ...taskRoutes,
  ...mcpRoutes,
];

const startApp = async () => {
  if (config.cache.backend === CacheBackend.Redis) {
    await initRedis();
  }
  await initCache();

  await registerApiMongoIndexes();

  await mcpDomain.seedMcps();
  console.log("MCPs seeded successfully");

  const systemAgentSeedResult = await systemAgentDomain.seedSystemAgents();
  console.log(
    `System agents seeded: ${systemAgentSeedResult.insertedCount} inserted, ${systemAgentSeedResult.skippedCount} skipped`,
  );

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

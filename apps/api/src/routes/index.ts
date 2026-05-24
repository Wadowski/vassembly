import { init as initMongoDb } from "@vassembly/client-mongodb";
import { createServer, routesWithPrefix } from "@vassembly/server";
import { config } from "@vassembly/config";
import { mongodbIndexes as agentMongodbIndexes } from "@vassembly/domain-agent";
import { mongodbIndexes as aiIntegrationMongodbIndexes } from "@vassembly/domain-ai-integration";
import { mongodbIndexes as userMongodbIndexes } from "@vassembly/domain-user";

import { routes as agentRoutesList } from "./agents";
import { routes as aiIntegrationRoutesList } from "./ai-integrations";
import { routes as authRoutesList } from "./auth";
import { routes as userRoutesList } from "./user";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/auth", authRoutesList);
const userRoutes = routesWithPrefix("/user", userRoutesList);
const agentRoutes = routesWithPrefix("/agents", agentRoutesList);
const aiIntegrationRoutes = routesWithPrefix("/ai-integrations", aiIntegrationRoutesList);

const routes = [...authRoutes, ...userRoutes, ...agentRoutes, ...aiIntegrationRoutes];

const startApp = async () => {
  await initMongoDb({
    indexFunctions: [userMongodbIndexes, agentMongodbIndexes, aiIntegrationMongodbIndexes],
  });

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

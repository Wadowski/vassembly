import { createServer, routesWithPrefix } from "@vassembly/server";
import { config } from "@vassembly/config";

import { authRoute } from "./auth/auth";
import { loginRoute } from "./user/login";
import { refreshRoute } from "./auth/refresh";
import { registerRoute } from "./user/register";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/auth", [authRoute, refreshRoute]);
const userRoutes = routesWithPrefix("/user", [loginRoute, registerRoute]);

const routes = [...authRoutes, ...userRoutes];

const startApp = async () => {
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

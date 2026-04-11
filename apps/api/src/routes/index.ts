import { createServer, routesWithPrefix } from "@vassembly/server";
import { config } from "@vassembly/config";

import { authRoute } from "./auth";
import { loginRoute } from "./login";
import { refreshRoute } from "./refresh";
import { registerRoute } from "./register";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/user", [authRoute, loginRoute, registerRoute, refreshRoute]);

const routes = [...authRoutes];

const startApp = async () => {
  const fastify = await createServer({
    routes,
    graphql: graphqlConfig,
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

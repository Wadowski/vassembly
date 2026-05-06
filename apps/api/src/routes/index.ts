import { init as initMongoDb } from "@vassembly/client-mongodb";
import { createServer, routesWithPrefix } from "@vassembly/server";
import { config } from "@vassembly/config";
import { mongodbIndexes } from "@vassembly/domain-user";

import { authRoute } from "./auth/auth";
import { forgotPasswordRoute } from "./user/forgotPassword";
import { loginRoute } from "./user/login";
import { refreshRoute } from "./auth/refresh";
import { logoutRoute } from "./auth/logout";
import { registerRoute } from "./user/register";
import { changePasswordRoute } from "./user/changePassword";
import { deleteAccountRoute } from "./user/deleteAccount";
import { resetPasswordRoute } from "./user/resetPassword";
import { updateProfileRoute } from "./user/updateProfile";
import { graphqlConfig } from "../graphql";

const authRoutes = routesWithPrefix("/auth", [authRoute, refreshRoute, logoutRoute]);
const userRoutes = routesWithPrefix("/user", [
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  changePasswordRoute,
  deleteAccountRoute,
  updateProfileRoute,
]);

const routes = [...authRoutes, ...userRoutes];

const startApp = async () => {
  await initMongoDb({
    indexFunctions: [mongodbIndexes],
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

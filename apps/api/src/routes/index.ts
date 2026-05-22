import { init as initMongoDb } from "@vassembly/client-mongodb";
import { createServer, routesWithPrefix } from "@vassembly/server";
import { config } from "@vassembly/config";
import { mongodbIndexes as agentMongodbIndexes } from "@vassembly/domain-agent";
import { mongodbIndexes as userMongodbIndexes } from "@vassembly/domain-user";

import { agentCreateRoute } from "./agents/create";
import { agentDeleteRoute } from "./agents/delete";
import { agentGetByIdRoute } from "./agents/getById";
import { agentListRoute } from "./agents/list";
import { agentRestoreRoute } from "./agents/restore";
import { agentPatchRoute } from "./agents/update";

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
const agentRoutes = routesWithPrefix("/agents", [
  agentCreateRoute,
  agentListRoute,
  agentGetByIdRoute,
  agentPatchRoute,
  agentDeleteRoute,
  agentRestoreRoute,
]);

const routes = [...authRoutes, ...userRoutes, ...agentRoutes];

const startApp = async () => {
  await initMongoDb({
    indexFunctions: [userMongodbIndexes, agentMongodbIndexes],
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

import { startServer } from "@vassembly/server";
import { config } from "@vassembly/config";

import { authRoute } from "./auth";
import { loginRoute } from "./login";
import { refreshRoute } from "./refresh";
import { registerRoute } from "./register";

export const routes = [authRoute, loginRoute, registerRoute, refreshRoute];

startServer({ routes, port: config.services.auth.port });